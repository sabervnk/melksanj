import { regulationUrl } from './tariff.mjs';
import { renewalReference, tehranReference } from './guidance.mjs';

export const siteLinks = {
  home: { title:['لوگوی سربرگ','Header logo'], fallback:'./' },
  designer: { title:['طراحی توسط صابر','Designed by Saber'], fallback:'mailto:saber.alfa@gmail.com' },
  regulation: { title:['آیین‌نامهٔ تعرفهٔ املاک','Real-estate fee regulation'], fallback:regulationUrl },
  tehran: { title:['منبع نرخنامهٔ تهران','Tehran tariff source'], fallback:tehranReference.source },
  registry: { title:['درگاه رسمی کاتب','Official Kateb portal'], fallback:'https://kateb.ir/' },
  marketMethod: { title:['استاندارد ارزیابی املاک مشابه','Comparable evidence standard'], fallback:'https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/comparable-evidence-in-real-estate-valuation' },
  rentLaw: { title:['مادهٔ ۸ قانون ساماندهی بازار اجاره','Rental market law, Article 8'], fallback:'https://dadrasai.com/laws/%D9%85%D8%A7%D8%AF%D9%87-8-%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%B3%D8%A7%D9%85%D8%A7%D9%86%D8%AF%D9%87%DB%8C-%D8%A8%D8%A7%D8%B2%D8%A7%D8%B1-%D8%B2%D9%85%DB%8C%D9%86-%D9%85%D8%B3%DA%A9%D9%86-%D9%88-%D8%A7%D8%AC%D8%A7%D8%B1%D9%87-%D8%A8%D9%87%D8%A7-f213be808a7b' },
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
