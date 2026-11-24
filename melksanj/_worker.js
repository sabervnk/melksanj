import { fonts, isColor, themeFields } from './content.mjs';
import { catalog } from './admin/catalog.mjs';

const knownText = new Set(catalog.map(item => item.key));
const sessionAge = 8 * 60 * 60;
const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
const random = size => hex(crypto.getRandomValues(new Uint8Array(size)));
const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const cookie = (value, age) => '__Host-melksanj-admin=' + value + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=' + age;

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
const error = (message, status) => json({ error: message }, status);
const run = (db, sql, ...values) => db.prepare(sql).bind(...values).run();
const first = (db, sql, ...values) => db.prepare(sql).bind(...values).first();

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
async function credentialMatches(password, record, env) {
  if (typeof password !== 'string' || password.length > 256 || !password) return false;
  if (record?.hash) return equal(await passwordHash(password, record.salt), record.hash);
  const secret = env.CMS_SETUP_PASSWORD;
  return typeof secret === 'string' && secret.length >= 20 && equal(await digest(password), await digest(secret));
}
async function getSession(db, request) {
  const token = request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-melksanj-admin=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const hash = await digest(token);
  const row = await first(db, 'SELECT expires FROM cms_sessions WHERE token = ? AND expires > ? AND generation = (SELECT salt FROM cms_password WHERE id = 1)', hash, now());
  return row ? hash : null;
}
async function issueSession(db, generation) {
  const token = random(32);
  const [, issued] = await db.batch([
    db.prepare('DELETE FROM cms_sessions WHERE expires <= ? OR generation != (SELECT salt FROM cms_password WHERE id = 1)').bind(now()),
    db.prepare('INSERT INTO cms_sessions (token, expires, generation) SELECT ?, ?, salt FROM cms_password WHERE id = 1 AND salt = ?')
      .bind(await digest(token), now() + sessionAge, generation)
  ]);
  if (!issued.meta.changes) return error('conflict', 409);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, sessionAge) });
}
async function settings(db) {
  const row = await first(db, 'SELECT body, revision FROM cms_content WHERE id = 1');
  return row ? { content: JSON.parse(row.body), revision: row.revision } : { content: {}, revision: 0 };
}
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function cleanContent(input) {
  if (!object(input)) throw new Error('invalidContent');
  const text = {};
  for (const [key, pair] of Object.entries(input.text ?? {})) {
    if (!knownText.has(key) || !object(pair)) throw new Error('invalidContent');
    const entry = {};
    for (const lang of ['fa', 'en']) {
      if (pair[lang] === undefined || pair[lang] === '') continue;
      if (typeof pair[lang] !== 'string' || pair[lang].length > 1200) throw new Error('invalidContent');
      entry[lang] = pair[lang];
    }
    if (Object.keys(entry).length) text[key] = entry;
  }
  const theme = {};
  for (const mode of ['light', 'dark']) {
    theme[mode] = {};
    for (const [key, color] of Object.entries(input.theme?.[mode] ?? {})) {
      if (!Object.hasOwn(themeFields, key) || !isColor(color)) throw new Error('invalidContent');
      theme[mode][key] = color;
    }
  }
  const appearance = {};
  for (const [setting, min, max] of [['size', 13, 24], ['radius', 0, 40], ['width', 860, 1600]]) {
    const value = input.appearance?.[setting];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value < min || value > max) throw new Error('invalidContent');
    appearance[setting] = value;
  }
  const font = input.appearance?.font;
  if (font !== undefined) {
    if (!Object.hasOwn(fonts, font)) throw new Error('invalidContent');
    appearance.font = font;
  }
  return { text, theme, appearance };
}
async function login(request, env, body) {
  const db = env.CMS_DB;
  const ip = await digest(request.headers.get('CF-Connecting-IP') || 'local');
  const time = now();
  const attempt = await first(db, `INSERT INTO cms_attempts (ip, tries, expires) VALUES (?, 1, ?)
    ON CONFLICT(ip) DO UPDATE SET tries = CASE WHEN expires <= ? THEN 1 ELSE tries + 1 END,
    expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END RETURNING tries`, ip, time + 900, time, time);
  if (attempt.tries > 10) return error('tryLater', 429);
  const record = await first(db, 'SELECT hash, salt FROM cms_password WHERE id = 1');
  if (!record?.hash && (!env.CMS_SETUP_PASSWORD || env.CMS_SETUP_PASSWORD.length < 20)) return error('setupRequired', 503);
  if (!await credentialMatches(body.password, record, env)) return error('invalidPassword', 401);
  await run(db, 'DELETE FROM cms_attempts WHERE ip = ? OR expires <= ?', ip, time);
  return issueSession(db, record?.salt ?? '');
}
async function api(request, env, path, origin) {
  const db = env.CMS_DB;
  if (path === '/api/site-content' && request.method === 'GET') {
    if (!db) return json({});
    return json((await settings(db)).content);
  }
  if (!path.startsWith('/api/admin/')) return error('notFound', 404);
  if (!db) return error('setupRequired', 503);
  const method = request.method;
  let body = {};
  if (method !== 'GET') {
    if (request.headers.get('Origin') !== origin || !request.headers.get('Content-Type')?.startsWith('application/json')) return error('forbidden', 403);
    if (Number(request.headers.get('Content-Length')) > 300000) return error('invalidContent', 413);
    const content = await request.text();
    if (content.length > 300000) return error('invalidContent', 413);
    try { body = JSON.parse(content); } catch { return error('invalidContent', 400); }
    if (!object(body)) return error('invalidContent', 400);
  }
  if (path === '/api/admin/login' && method === 'POST') return login(request, env, body);
  const session = await getSession(db, request);
  if (!session) return error('signInRequired', 401);
  if (path === '/api/admin/logout' && method === 'POST') {
    await run(db, 'DELETE FROM cms_sessions WHERE token = ?', session);
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
  }
  if (path === '/api/admin/content' && method === 'GET') return json(await settings(db));
  if (path === '/api/admin/content' && method === 'PUT') {
    let next;
    try { next = cleanContent(body.content); } catch { return error('invalidContent', 400); }
    if (!Number.isSafeInteger(body.revision) || body.revision < 0) return error('invalidContent', 400);
    const changed = await run(db, `UPDATE cms_content SET body = ?, revision = revision + 1
      WHERE id = 1 AND revision = ? AND EXISTS
      (SELECT 1 FROM cms_sessions WHERE token = ? AND expires > ? AND generation = (SELECT salt FROM cms_password WHERE id = 1))`, JSON.stringify(next), body.revision, session, now());
    return changed.meta.changes ? json({ content: next, revision: body.revision + 1 }) : error('conflict', 409);
  }
  if (path === '/api/admin/password' && method === 'POST') {
    const record = await first(db, 'SELECT hash, salt FROM cms_password WHERE id = 1');
    if (!await credentialMatches(body.current, record, env)) return error('invalidPassword', 401);
    if (typeof body.next !== 'string' || body.next.length < 14 || body.next.length > 256 || body.next === body.current) return error('invalidNewPassword', 400);
    const salt = random(16);
    const hash = await passwordHash(body.next, salt);
    const changed = await run(db, `UPDATE cms_password SET hash = ?, salt = ? WHERE id = 1 AND hash = ?
      AND EXISTS (SELECT 1 FROM cms_sessions WHERE token = ? AND expires > ? AND generation = (SELECT salt FROM cms_password WHERE id = 1))`,
      hash, salt, record?.hash ?? '', session, now());
    return changed.meta.changes ? issueSession(db, salt) : error('conflict', 409);
  }
  return error('notFound', 404);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env, url.pathname, url.origin); }
    catch (exception) {
      console.error('Melksanj CMS request failed', exception.message);
      return url.pathname === '/api/site-content' ? json({}) : error('setupRequired', 503);
    }
  }
};
