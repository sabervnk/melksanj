export const themeFields = {
  bg: ['پس‌زمینه', '#f2f4f5', '#131d27'],
  ink: ['متن اصلی', '#172735', '#f3f5f9'],
  sub: ['متن فرعی', '#3c4b58', '#c3cdd8'],
  muted: ['متن کم‌رنگ', '#52616d', '#aebccc'],
  paper: ['پس‌زمینهٔ کارت‌ها', '#ffffff', '#202e3b'],
  solid: ['سطح فرم‌ها', '#f4f6f8', '#192531'],
  edge: ['حاشیه‌ها', '#d9e0e6', '#404f60'],
  accent: ['رنگ تأکیدی و لینک‌ها', '#9f361e', '#ffc2ac'],
  mint: ['سطح انتخاب و تعامل', '#fceae4', '#50342e'],
  mintText: ['متن انتخاب و نتیجه', '#862e1b', '#ffd4c6'],
  hero: ['پس‌زمینهٔ سربرگ', '#202e3e', '#202e3e'],
  heroText: ['متن سربرگ', '#f5f8fb', '#f5f8fb'],
  error: ['متن خطا', '#972b20', '#ffb9ac'],
  warningBg: ['پس‌زمینهٔ هشدار', '#fff4dd', '#44321d'],
  warningText: ['متن هشدار', '#603704', '#ffe0a8']
};
export const fonts = {
  vazirmatn: 'Vazirmatn, system-ui, sans-serif',
  system: 'system-ui, sans-serif',
  serif: 'Georgia, serif',
  mono: 'ui-monospace, monospace'
};
export const textKey = (fa, en) => JSON.stringify([fa, en]);
export const localized = (content, lang, fa, en) => {
  const value = content?.text?.[textKey(fa, en)]?.[lang];
  return typeof value === 'string' && value !== '' ? value : (lang === 'en' ? en : fa);
};
export const isColor = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
export function applyTheme(content) {
  const root = document.documentElement;
  const theme = content.theme?.[root.dataset.theme] ?? {};
  for (const key of Object.keys(themeFields)) {
    const property = key === 'hero' ? '--cms-hero' : key === 'heroText' ? '--cms-hero-text' : '--' + key;
    if (isColor(theme[key])) root.style.setProperty(property, theme[key]);
    else root.style.removeProperty(property);
  }
  const { size, font, radius, width } = content.appearance ?? {};
  root.style.fontSize = Number.isInteger(size) && size >= 13 && size <= 24 ? size + 'px' : '';
  root.style.setProperty('--cms-font', Object.hasOwn(fonts, font) ? fonts[font] : '');
  root.style.setProperty('--cms-radius', Number.isInteger(radius) && radius >= 0 && radius <= 40 ? radius + 'px' : '');
  root.toggleAttribute('data-custom-radius', Number.isInteger(radius) && radius >= 0 && radius <= 40);
  root.toggleAttribute('data-custom-width', Number.isInteger(width) && width >= 860 && width <= 1600);
  root.style.setProperty('--cms-width', Number.isInteger(width) && width >= 860 && width <= 1600 ? width + 'px' : '');
}
export async function loadContent() {
  try {
    const response = await fetch('/api/site-content', { signal: AbortSignal.timeout(4000) });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
