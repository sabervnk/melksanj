import { safeSiteLink, siteLinks } from '../site-links.mjs';
import { catalog } from './catalog.mjs';
import { themeFields, isColor, fonts } from '../content.mjs';

const $ = id => document.getElementById(id);
const labels = {
  brand:['ملک‌سنج','Melksanj'], subtitle:['مدیریت سایت','Site administration'],
  openSite:['مشاهده سایت ↗','View site ↗'], logout:['خروج','Sign out'],
  loginTitle:['ورود مدیر','Admin sign-in'], loginDescription:['برای مدیریت نوشته‌ها و ظاهر سایت وارد شوید.','Sign in to manage site content and appearance.'],
  passwordLabel:['رمز ورود','Password'], loginButton:['ورود','Sign in'],
  editorTitle:['مدیریت سایت','Manage site'], publish:['انتشار تغییرات','Publish changes'],
  previewTitle:['پیش‌نمایش زنده','Live preview'], appearance:['ظاهر و قلم','Appearance and fonts'],
  header:['سربرگ و منو','Header and navigation'], convert:['رهن و اجاره','Deposit and rent'],
  renewal:['تمدید قرارداد','Renewal'], fee:['کمیسیون','Agent fees'], compare:['مقایسه','Comparison'],
  shared:['فرم‌ها و پیام‌ها','Forms and messages'], history:['سوابق و اعلان‌ها','History and notices'],
  guide:['راهنما و منابع','Guide and sources'], footer:['فوتر و ارتباط','Footer and contact'],
  links:['لینک‌های سایت','Site links'],
  linkHelp:['آدرس کامل، ایمیل با mailto: یا مسیر داخلی وارد کنید. فیلد خالی، آدرس پیش‌فرض را برمی‌گرداند.','Enter a full URL, a mailto: address, or an internal path. Clear the field to restore the default.'],
  badLink:['آدرس معتبر نیست.','Enter a valid link.'],
  security:['رمز ورود','Password'], dark:['تیره','Dark'], light:['روشن','Light'],
  search:['جستجو در نوشته‌ها','Search site copy'], noMatches:['نوشته‌ای پیدا نشد.','No matching text.'],
  current:['رمز فعلی','Current password'], next:['رمز جدید (حداقل ۱۴ کاراکتر)','New password (at least 14 characters)'],
  confirm:['تکرار رمز جدید','Confirm new password'], change:['تغییر رمز','Change password'],
  published:['تغییرات منتشر شد.','Changes published.'], changed:['رمز تغییر کرد.','Password changed.'],
  invalidPassword:['رمز واردشده درست نیست.','Incorrect password.'],
  invalidNewPassword:['رمز جدید باید متفاوت و حداقل ۱۴ کاراکتر باشد.','Choose a different password with at least 14 characters.'],
  mismatch:['دو رمز جدید یکسان نیستند.','The new passwords do not match.'],
  setupRequired:['اتصال پایگاه داده و رمز اولیه در هاست باید تنظیم شود.','Configure the database and initial password on the host.'],
  signInRequired:['جلسه تمام شد. دوباره وارد شوید.','Your session ended. Sign in again.'],
  tryLater:['تلاش‌های زیادی انجام شد. ۱۵ دقیقه دیگر امتحان کنید.','Too many attempts. Try again in 15 minutes.'],
  conflict:['نسخهٔ دیگری ذخیره شده است. قبل از ادامه، صفحه را دوباره باز کنید.','Another version was saved. Reload before continuing.'],
  failure:['ارتباط برقرار نشد. دوباره تلاش کنید.','Request failed. Try again.'],
  invalidContent:['مقدار یکی از فیلدها قابل ذخیره نیست.','One of the values cannot be saved.'],
  reset:['پیش‌فرض','Default'], lighterColors:['رنگ‌های حالت روشن','Light theme colors'], darkerColors:['رنگ‌های حالت تیره','Dark theme colors']
};
const sections = ['appearance','header','convert','renewal','fee','compare','shared','history','guide','footer','links','security'];
const liveTabs = new Set(['convert','renewal','fee','compare']);
const defaults = () => ({ text: {}, links: {}, theme: { light: {}, dark: {} }, appearance: {} });
let lang = new URL(location.href).searchParams.get('lang') === 'en' ? 'en' : 'fa';
let selected = 'appearance';
let previewLang = lang;
let previewTheme = 'light';
let draft = defaults();
let revision = 0;
let dirty = false;
const invalidLinks = new Map();
let statusTimer;
const t = key => labels[key]?.[lang === 'en' ? 1 : 0] ?? labels.failure[lang === 'en' ? 1 : 0];

function element(tag, text = '', attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
async function request(path, method = 'GET', body) {
  const response = await fetch('/api/admin/' + path, { method, credentials: 'same-origin', ...(method !== 'GET' && {
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {})
  }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'failure');
  return data;
}
function announce(key, failed = false) {
  clearTimeout(statusTimer);
  $('status').textContent = t(key);
  $('status').dataset.error = failed;
  $('status').hidden = false;
  statusTimer = setTimeout(() => { $('status').hidden = true; }, failed ? 9000 : 4500);
}
function toggleSession(active) {
  $('gate').hidden = active;
  $('studio').hidden = !active;
  $('logout').hidden = !active;
  if (active && !$('preview').hasAttribute('src')) $('preview').src = '../?preview=1';
  if (!active) $('preview').removeAttribute('src');
}
function preview() {
  $('previewLang').textContent = previewLang === 'fa' ? 'EN' : 'FA';
  $('previewTheme').textContent = t(previewTheme === 'dark' ? 'light' : 'dark');
  $('preview').contentWindow?.postMessage({
    type: 'melksanj-preview', content: draft, lang: previewLang, theme: previewTheme,
    tab: liveTabs.has(selected) ? selected : undefined
  }, location.origin);
}
function changed() {
  dirty = true;
  $('publish').disabled = false;
  preview();
}
function language() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.title = t('brand') + ' | ' + t('subtitle');
  $('locale').textContent = lang === 'fa' ? 'EN' : 'فارسی';
  for (const key of ['brand','subtitle','openSite','logout','loginTitle','loginDescription','passwordLabel','loginButton','editorTitle','publish','previewTitle']) $(key).textContent = t(key);
  render();
}
function render() {
  $('sections').replaceChildren(...sections.map(key => {
    const button = element('button', t(key), { type:'button', 'aria-current': String(key === selected) });
    button.onclick = () => { selected = key; render(); };
    return button;
  }));
  $('sectionTitle').textContent = t(selected);
  $('publish').hidden = selected === 'security';
  $('publish').disabled = !dirty;
  $('body').replaceChildren();
  if (selected === 'appearance') appearance();
  else if (selected === 'security') security();
  else if (selected === 'links') editLinks();
  else copy();
  preview();
}
function control(label, input) {
  const bar = element('label', label);
  bar.append(input);
  return bar;
}
function appearance() {
  const layout = element('fieldset');
  layout.append(element('legend', t('appearance')));
  const fields = element('div', '', { class:'fields' });
  for (const [key, fa, en, min, max, fallback] of [
    ['size','اندازه پایه قلم','Base font size',13,24,16],['radius','گردی گوشه‌ها','Corner radius',0,40,''],
    ['width','حداکثر عرض دسکتاپ','Desktop maximum width',860,1600,1180]
  ]) {
    const input = element('input','',{type:'number',min,max,placeholder:String(fallback)});
    input.value = draft.appearance[key] ?? '';
    input.addEventListener('change', () => {
      if (!input.checkValidity()) { input.reportValidity(); input.value = draft.appearance[key] ?? ''; return; }
      if (input.value === '') delete draft.appearance[key];
      else draft.appearance[key] = Number(input.value);
      changed();
    });
    fields.append(control((lang === 'fa' ? fa : en) + ' (px)', input));
  }
  const font = element('select');
  font.append(element('option', t('reset'), {value:''}));
  for (const [key,label] of Object.entries({vazirmatn:'Vazirmatn',system:'System',serif:'Serif',mono:'Monospace'})) {
    if (Object.hasOwn(fonts,key)) font.append(element('option',label,{value:key}));
  }
  font.value = draft.appearance.font ?? '';
  font.onchange = () => {
    if (font.value) draft.appearance.font = font.value;
    else delete draft.appearance.font;
    changed();
  };
  fields.append(control(lang === 'fa' ? 'خانوادهٔ قلم' : 'Font family',font));
  layout.append(fields);
  $('body').append(layout);
  for (const [mode,title,index] of [['light','lighterColors',1],['dark','darkerColors',2]]) {
    const group = element('fieldset');
    group.append(element('legend', t(title)));
    for (const [key, details] of Object.entries(themeFields)) {
      const fallback = details[index];
      const line = element('div','',{class:'color'});
      const label = lang === 'fa' ? details[0] : ({
        bg:'Background', ink:'Main text',sub:'Secondary text',muted:'Muted text',paper:'Cards',solid:'Form surfaces',
        edge:'Borders',accent:'Accent and links',mint:'Selection surface',mintText:'Selection and result text',
        hero:'Hero background',heroText:'Hero text',error:'Errors',warningBg:'Warning background',warningText:'Warning text'
      })[key];
      const input = element('input','',{type:'color', 'aria-label': label});
      input.value = isColor(draft.theme[mode][key]) ? draft.theme[mode][key] : fallback;
      input.oninput = () => { draft.theme[mode][key] = input.value; previewTheme = mode; changed(); };
      const reset = element('button',t('reset'),{type:'button'});
      reset.onclick = () => { delete draft.theme[mode][key]; input.value = fallback; previewTheme = mode; changed(); };
      const controls = element('div');
      controls.append(input,reset);
      line.append(element('span',label),controls);
      group.append(line);
    }
    $('body').append(group);
  }
}
function editLinks() {
  $('body').append(element('p', t('linkHelp')));
  for (const [key, link] of Object.entries(siteLinks)) {
    const input = element('input', '', { type:'text', dir:'ltr', maxlength:2048, placeholder:link.fallback });
    input.value = invalidLinks.get(key) ?? draft.links[key] ?? '';
    if (invalidLinks.has(key)) input.setCustomValidity(t('badLink'));
    input.oninput = () => {
      const value = input.value.trim();
      const destination = value && safeSiteLink(value);
      input.setCustomValidity(value && !destination ? t('badLink') : '');
      if (value && !destination) invalidLinks.set(key, input.value);
      else invalidLinks.delete(key);
      if (destination) draft.links[key] = destination;
      else if (!value) delete draft.links[key];
      changed();
    };
    $('body').append(control(link.title[lang === 'en' ? 1 : 0], input));
  }
}

function copy() {
  const search = element('input','',{type:'search',placeholder:t('search'),'aria-label':t('search')});
  const list = element('div','',{class:'body'});
  function show() {
    const query = search.value.toLocaleLowerCase();
    const rows = catalog.filter(item => item.section === selected && [item.fa,item.en,draft.text[item.key]?.fa,draft.text[item.key]?.en].some(value => value?.toLocaleLowerCase().includes(query)));
    list.replaceChildren(...rows.map(item => {
      const group = element('fieldset');
      group.append(element('legend', (lang === 'fa' ? item.fa : item.en).slice(0,75)));
      const fields = element('div','',{class:'fields'});
      for (const [key,title,dir] of [['fa','فارسی','rtl'],['en','English','ltr']]) {
        const input = element('textarea','',{maxlength:1200,placeholder:item[key],dir});
        input.value = draft.text[item.key]?.[key] ?? '';
        input.oninput = () => {
          const entry = draft.text[item.key] ??= {};
          if (input.value.trim()) entry[key] = input.value;
          else delete entry[key];
          if (!Object.keys(entry).length) delete draft.text[item.key];
          changed();
        };
        fields.append(control(title,input));
      }
      group.append(fields);
      return group;
    }));
    if (!rows.length) list.append(element('p',t('noMatches')));
  }
  search.oninput = show;
  $('body').append(search,list);
  show();
}
function security() {
  const form = element('form');
  const fields = {};
  for (const key of ['current','next','confirm']) {
    fields[key] = element('input','',{type:'password',required:'',maxlength:256,
      autocomplete:key === 'current' ? 'current-password' : 'new-password'});
    if (key !== 'current') fields[key].minLength = 14;
    form.append(control(t(key),fields[key]));
  }
  const submit = element('button',t('change'),{class:'primary'});
  form.append(submit);
  form.onsubmit = async event => {
    event.preventDefault();
    if (fields.next.value !== fields.confirm.value) { announce('mismatch',true); return; }
    submit.disabled = true;
    try {
      await request('password','POST',{current:fields.current.value,next:fields.next.value});
      form.reset();
      announce('changed');
    } catch (e) { announce(e.message,true); }
    finally { submit.disabled = false; }
  };
  $('body').append(form);
}
async function openStudio() {
  const result = await request('content');
  revision = result.revision;
  invalidLinks.clear();
  const content = result.content;
  const text = Object.fromEntries(catalog.filter(({ key }) => Object.hasOwn(content.text ?? {}, key))
    .map(({ key }) => [key, content.text[key]]));
  draft = { text, links: content.links ?? {}, theme: { light: content.theme?.light ?? {}, dark: content.theme?.dark ?? {} }, appearance: content.appearance ?? {} };
  dirty = false;
  toggleSession(true);
  render();
}
$('locale').onclick = () => {
  lang = lang === 'fa' ? 'en' : 'fa';
  const url = new URL(location.href);
  url.searchParams.set('lang',lang);
  history.replaceState(null,'',url);
  language();
};
$('loginForm').onsubmit = async event => {
  event.preventDefault();
  $('loginButton').disabled = true;
  try {
    await request('login','POST',{password:$('password').value});
    $('loginForm').reset();
    await openStudio();
  } catch (e) { announce(e.message,true); }
  finally { $('loginButton').disabled = false; }
};
$('logout').onclick = async () => {
  try {
    await request('logout','POST');
    dirty = false;
    draft = defaults();
    toggleSession(false);
  } catch (e) { announce(e.message,true); }
};
$('publish').onclick = async () => {
  if (invalidLinks.size) { selected = 'links'; render(); $('body').querySelector(':invalid')?.reportValidity(); return; }
  $('publish').disabled = true;
  const submitted = JSON.stringify(draft);
  try {
    const result = await request('content','PUT',{content:JSON.parse(submitted),revision});
    revision = result.revision;
    dirty = submitted !== JSON.stringify(draft);
    announce('published');
  } catch (e) { announce(e.message,true); }
  finally { $('publish').disabled = !dirty; }
};
$('previewLang').onclick = () => { previewLang = previewLang === 'fa' ? 'en' : 'fa'; preview(); };
$('previewTheme').onclick = () => { previewTheme = previewTheme === 'dark' ? 'light' : 'dark'; preview(); };
$('preview').onload = preview;
addEventListener('beforeunload', event => {
  if (dirty) event.preventDefault();
});
language();
openStudio().catch(e => {
  toggleSession(false);
  if (e.message !== 'signInRequired') announce(e.message,true);
});
