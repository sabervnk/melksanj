import { regulationUrl } from './tariff.mjs';
import { renewalReference, tehranReference } from './guidance.mjs';

export const siteLinks = {
  home: { title:['لوگوی سربرگ','Header logo'], fallback:'./' },
  designer: { title:['طراحی توسط صابر','Designed by Saber'], fallback:'mailto:saber.alfa@gmail.com' },
  regulation: { title:['آیین‌نامهٔ تعرفهٔ املاک','Real-estate fee regulation'], fallback:regulationUrl },
  tehran: { title:['منبع نرخنامهٔ تهران','Tehran tariff source'], fallback:tehranReference.source },
  renewal: { title:['منبع و شرایط تمدید','Renewal rules and conditions'], fallback:renewalReference.source }
};

export function safeSiteLink(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  const link = value.trim();
  if (!link || /[\x00-\x20\x7f\\]/.test(link)) return null;
  if ((link.startsWith('/') && !link.startsWith('//')) || link.startsWith('./') || link.startsWith('#')) return link;
  try {
    const url = new URL(link);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href;
    if (url.protocol === 'mailto:' && /^[^@/?#]+@[^@/?#]+$/.test(url.pathname) && !url.search && !url.hash) return url.href;
  } catch {}
  return null;
}

export const siteLink = (content, key) => safeSiteLink(content?.links?.[key]) ?? siteLinks[key].fallback;
