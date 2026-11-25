import { siteLink } from './site-links.mjs';
import { loadContent, localized, applyTheme } from './content.mjs';
import { tehranReference, renewalReference, tehranFee, renewalChanges } from './guidance.mjs';
import { groupedInput, caretAt, separator } from './number-input.mjs';
import { countyKey, tariffType, httpsSource, tariffDate, tehranDay, findTariff } from './tariff.mjs';
import { MILLION, PERCENT, normalize, money, percentage, divide, monthlyFromFull, fullFromMonthly, equivalent, growthPercent, renew, commission, scenario } from './math.mjs';

const $ = id => document.getElementById(id);
const initial = {
  lang: 'fa', theme: 'light', tab: 'convert', saved: [],
  convert: { mode: 'split', full: '', share: 50, deposit: '', rent: '', reverseDeposit: '', reverseRent: '', anchor: 'share', rate: '30000' },
  renewal: { mode: 'target', apply: 'both', deposit: '', rent: '', increase: '', newDeposit: '', newRent: '', rate: '30000' },
  fee: { mode: 'tehran', type: 'sale', value: '', factor: '', vat: '', cap: '', tariffs: {}, county: '', localRates: [], loadedRate: null, quote: 'total', price: '', deposit: '', rent: '', custom: '', rate: '30000', tehran: {} },
  compare: { rate: '30000', months: '12', offers: [{ deposit: '', rent: '', fee: '' }, { deposit: '', rent: '', fee: '' }] }
};
const previewMode = window.parent !== window && new URLSearchParams(location.search).has('preview');
const key = 'melksanj-v1';
let stored;
try { if (!previewMode) stored = JSON.parse(localStorage.getItem(key)); } catch {}
const state = structuredClone(initial);
if (stored && typeof stored === 'object') {
  for (const group of ['convert', 'renewal', 'fee', 'compare']) {
    if (stored[group] && typeof stored[group] === 'object') Object.assign(state[group], stored[group]);
  }
  for (const name of ['lang', 'theme', 'tab']) if (typeof stored[name] === 'string') state[name] = stored[name];
  if (Array.isArray(stored.saved)) state.saved = stored.saved.slice(0, 12);
}
const modes = { convert: ['split', 'reverse'], renewal: ['target', 'actual'], fee: ['tehran', 'official', 'estimate'] };
for (const [group, values] of Object.entries(modes)) if (!values.includes(state[group].mode)) state[group].mode = initial[group].mode;
if (!['both', 'deposit', 'rent'].includes(state.renewal.apply)) state.renewal.apply = 'both';
if (!['sale', 'lease', 'full'].includes(state.fee.type)) state.fee.type = 'sale';
if (!Array.isArray(state.compare.offers) || state.compare.offers.length < 2 || state.compare.offers.length > 3 || state.compare.offers.some(item => !item || typeof item !== 'object')) state.compare.offers = structuredClone(initial.compare.offers);
if (!Object.hasOwn(initial, state.tab) || !['convert', 'renewal', 'fee', 'compare'].includes(state.tab)) state.tab = 'convert';
let storageAvailable = true;
function persist() {
  if (previewMode) return;
  try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
let content = {};
const raw = (fa, en) => localized(content, state.lang, fa, en);
const t = (fa, en) => {
  const value = raw(fa, en);
  return value === (state.lang === 'en' ? en : fa) ? value : escape(value);
};
const locale = () => state.lang === 'en' ? 'en-US' : 'fa-IR';
const number = value => new Intl.NumberFormat(locale()).format(value);
const unit = () => t('تومان', 'toman');
const amount = value => `${number(value)} ${unit()}`;
const percent = value => `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 4 }).format(Number(value) / 10_000)}٪`.replace('٪', t('٪', '%'));
const signed = value => `${value > 0n ? '+' : ''}${amount(value)}`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const destination = id => siteLink(content, id);
const copyright = () => t('© ملک‌سنج · همهٔ حقوق محفوظ است.', '© Melksanj · All rights reserved.');
if (!Array.isArray(state.fee.localRates)) state.fee.localRates = [];
if (!state.fee.tehran || typeof state.fee.tehran !== 'object') state.fee.tehran = {};
if (state.fee.mode === 'official' && !state.fee.county && !state.fee.value && !state.fee.factor && !state.fee.cap) state.fee.mode = 'tehran';
const paths = {
  warning: '<path d="M10.3 4.9 2.5 18a1.8 1.8 0 0 0 1.6 2.7h15.8a1.8 1.8 0 0 0 1.6-2.7L13.7 4.9a2 2 0 0 0-3.4 0ZM12 9v4m0 3h.01"/>',
  input: '<path d="M12 20h9M16.5 3.5l4 4L8 20l-5 1 1-5 12.5-12.5Z"/>',
  arrows: '<path d="M4 8h15m-4-4 4 4-4 4m5 4H5m4-4-4 4 4 4"/>',
  renew: '<path d="M20 9a8 8 0 0 0-14-3L3 9m0-5v5h5m-4 6a8 8 0 0 0 14 3l3-3m-5 0h5v5"/>',
  bill: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm4 5h6m-6 4h6m-6 4h3"/>',
  compare: '<path d="M4 20V9m5 11V4m6 16v-7m5 7V7M2 20h20"/>',
  history: '<path d="M3 12a9 9 0 1 1 3 6.7M3 12V6m0 6h6m3-5v5l3 2"/>',
  moon: '<path d="M20.6 15A8.5 8.5 0 0 1 9 3.4 8.6 8.6 0 1 0 20.6 15Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8m-7 4h.01m3 0h.01m3 0h.01m-6 4h.01m3 0h.01m3 0h.01" stroke-width="2.4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 5V4H4v12h1"/>',
  save: '<path d="M6 4h12v16l-6-4-6 4V4Z"/>',
  close: '<path d="m6 6 12 12m0-12L6 18"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
const tabs = () => ({
  convert: [t('تبدیل رهن و اجاره', 'Convert rent & deposit'), 'arrows'],
  renewal: [t('تمدید قرارداد', 'Renewal'), 'renew'],
  fee: [t('کمیسیون بنگاه', 'Agent fees'), 'bill'],
  compare: [t('مقایسه پیشنهادها', 'Compare offers'), 'compare']
});
const btn = (action, label, kind = 'quiet', image = '') => `<button type="button" class="${kind}" data-action="${action}">${image ? icon(image) : ''}${label}</button>`;
const group = (setting, title, entries, active) => `<div class="segment" role="group" aria-label="${title}">${entries.map(([value,label]) => `<button type="button" data-set="${setting}" data-value="${value}" aria-pressed="${active === value}">${label}</button>`).join('')}</div>`;
const hint = (name, message = '') => `<small class="fieldNote" id="hint-${name}">${message}</small>`;
const examples = {
  full:'1000000000', deposit:'500000000', rent:'15000000', reverseDeposit:'500000000', reverseRent:'15000000',
  newDeposit:'600000000', newRent:'18000000', increase:'20', rate:'30000', value:'100000000',
  factor:'5', cap:'4000000', vat:'10', price:'5000000000', custom:'0.5', months:'12', fee:'5000000'
};
function formatted(raw, kind) {
  return groupedInput(raw ?? '', kind, state.lang !== 'en');
}
function field(name, label, value, options = {}) {
  const { kind = 'money', suffix = unit(), example, help = '' } = options;
  const sampleValue = example ?? examples[name.split('-').at(-1)];
  const placeholder = t('مثلاً ', 'e.g. ') + formatted(sampleValue, kind);
  return `<label class="field" for="in-${name}"><span class="label" id="label-${name}">${label}</span>
  <span class="fieldBox"><input type="text" id="in-${name}" aria-labelledby="label-${name}" dir="ltr" inputmode="${kind === 'decimal' ? 'decimal' : 'numeric'}" maxlength="32" autocomplete="off" spellcheck="false" aria-describedby="hint-${name}${help ? ' help-'+name : ''}" data-field="${name}" data-kind="${kind}" value="${escape(formatted(value, kind))}" placeholder="${escape(placeholder)}"><span class="unit">${suffix}</span></span>${help ? `<small class="fieldNote" id="help-${name}">${help}</small>` : ''}${hint(name)}</label>`;
}
function select(name, label, entries, value) {
  return `<label class="field" for="in-${name}"><span class="label">${label}</span><span class="fieldBox selectBox"><select id="in-${name}" data-select="${name}">${entries.map(([id,text]) => `<option value="${id}" ${value === id ? 'selected' : ''}>${text}</option>`).join('')}</select></span></label>`;
}
const rateField = value => `<div class="rateLine"><details id="rateDetails"><summary id="rateSummary"></summary>${field('rate', t('اجارهٔ ماهانه به‌ازای هر یک میلیون تومان رهن', 'Monthly rent per one million toman of deposit'), value)}<p class="help">${t('نرخ تبدیل را مطابق توافق یا پیشنهاد وارد کنید.', 'Enter the conversion rate used in your offer or agreement.')}</p></details></div>`;
const intro = (title, message) => `<div class="inlineGuide"><strong>${title}</strong><p>${message}</p></div>`;
const step = (isResult, image) => `<div class="step"><span class="tile">${icon(image)}</span><span>${isResult ? t('۳. نتیجه و خروجی','3. Review and export') : t('۲. مبلغ‌ها را وارد کنید','2. Enter your amounts')}</span></div>`;
const reset = () => btn('reset',t('پاک کردن فرم','Clear form'),'quiet reset', 'renew');
const warningsPanel = () => '<div id="warnings" class="warnings" aria-live="polite"></div>';
const card = (title, description, contents, wide = false) => `<article class="card glass ${wide ? 'wide' : ''}"><div class="stageBar">${step(false,'input')}${reset()}</div><div class="cardHead"><div><h2>${title}</h2><p>${description}</p></div></div>${contents}<div id="error" class="notice" role="status"></div><button type="button" class="quiet jumpResult" data-action="jump-result">${icon('calc')}${t('دیدن نتیجه','See result')}</button></article>`;
const resultActions = () => `<div class="resultActions">
  ${btn('export-png', t('دانلود عکس', 'Download PNG'), 'button', 'download')}
  ${btn('export-pdf', t('دانلود PDF', 'Download PDF'), 'quiet', 'download')}
  ${btn('save', t('ذخیره نتیجه', 'Save result'), 'quiet', 'save')}
  ${btn('copy', t('کپی نتیجه', 'Copy result'), 'quiet', 'copy')}
</div>`;
const panel = () => `<aside class="card glass result resultStage" aria-labelledby="result-heading"><div class="stageBar">${step(true,'calc')}</div><div class="resultTitle"><h2 id="result-heading" tabindex="-1">${t('نتیجهٔ محاسبه', 'Calculation result')}</h2></div>${warningsPanel()}<div id="result" aria-live="polite"></div>${resultActions()}</aside>`;
const metric = (label, value, main = false) => `<div class="${main ? 'resultMain' : 'figure'}"><span class="amountLabel">${label}</span><strong dir="auto">${number(value)}</strong><small>${unit()}</small></div>`;
const row = (label, text) => `<div class="row"><span>${label}</span><b dir="auto">${text}</b></div>`;
let report = null;

function frame() {
  document.documentElement.lang = state.lang === 'en' ? 'en' : 'fa';
  document.documentElement.dir = state.lang === 'en' ? 'ltr' : 'rtl';
  document.documentElement.dataset.theme = state.theme === 'dark' ? 'dark' : 'light';
  applyTheme(content);
  document.title = raw('ملک‌سنج | محاسبه‌گر رهن و اجاره', 'Melksanj | Deposit and rent calculator');
  delete $('steps').dataset.ready;
  $('skip').textContent = raw('رفتن به محتوای اصلی', 'Skip to content');
  $('top').innerHTML = `<a class="brand" href="${escape(destination('home'))}" aria-label="${t('ملک‌سنج', 'Melksanj')}"><img src="mark.svg" alt=""><span><strong>${t('ملک‌سنج', 'Melksanj')}</strong><small>${t('محاسبه‌گر املاک', 'Property calculator')}</small></span></a>
  <div class="actions">
  <button class="topAction" data-action="history" aria-label="${t('سوابق محاسبه', 'Saved calculations')}">${icon('history')}<span class="actionText">${t('سوابق', 'History')}</span></button>
  <button class="topAction" data-action="language" aria-label="${t('نمایش به انگلیسی','Show in Persian')}">${t('EN', 'فارسی')}</button>
  <button class="topAction iconOnly" data-action="theme" aria-label="${state.theme === 'dark' ? t('حالت روشن', 'Light theme') : t('حالت تاریک', 'Dark theme')}">${icon(state.theme === 'dark' ? 'sun' : 'moon')}</button></div>`;
  $('hero').innerHTML = `<div class="heroContent"><span class="heroTag">${icon('calc')}${t('محاسبه‌گر قراردادهای ملکی', 'Property contract calculator')}</span>
  <h1>${t('رهن و اجاره،', 'Deposit and rent,')}<span>${t('با حساب روشن.', 'with clear numbers.')}</span></h1>
  <p>${t('یک کار را از دکمه‌های زیر انتخاب کنید. مبلغ‌ها را وارد کنید و همان لحظه نتیجه را ببینید.', 'Choose what you want to calculate below. The result updates as you enter amounts.')}</p></div>`;
  $('nav').setAttribute('aria-label', raw('محاسبه‌گرها', 'Calculators'));
  $('nav').innerHTML = Object.entries(tabs()).map(([id,[label,image]]) => `<button type="button" data-tab="${id}" aria-pressed="${state.tab === id}" aria-controls="workspace">${icon(image)}<span>${label}</span></button>`).join('');
  $('guide').innerHTML = `<details><summary>${t('روش محاسبه و منابع', 'Method and sources')}</summary>
  <p>${t('ارزش معادل رهن از جمع مبلغ رهن و معادل رهنِ اجارهٔ ماهانه به‌دست می‌آید. نرخ پیش‌فرضِ تبدیل ۳۰٬۰۰۰ تومان به‌ازای هر یک میلیون تومان رهن است و می‌توان آن را تغییر داد. مبالغ نهایی به نزدیک‌ترین تومان گرد می‌شوند.', 'Full-deposit equivalent adds the deposit to the deposit value of monthly rent. The editable example conversion rate is 30,000 toman per one million toman of deposit. Final amounts are rounded to the nearest toman.')}</p>
  <p>${t('برای قراردادهای مشمول آیین‌نامه، ارزش معاملاتی موضوع مادهٔ ۶۴، ضریب مصوب و سقف تعرفه را برای شهرستان و نوع قرارداد از مرجع مربوط بگیرید.', 'For contracts covered by the regulation, obtain the Article 64 transactional value, approved coefficient, and applicable cap for the county and contract type.')}</p>
  <p><a href="${escape(destination('regulation'))}" target="_blank" rel="noopener noreferrer">${t('متن آیین‌نامهٔ تعیین تعرفهٔ دلالان معاملات املاک', 'Read the regulation on real-estate brokerage fees')}</a></p></details>`;
  $('footer').innerHTML = `
    <div class="footInfo">
      <b>${t('ملک‌سنج', 'Melksanj')}</b>
      <p>${t('واحد تمام مبالغ تومان است. سوابق در همین مرورگر می‌مانند.', 'All amounts are in toman. History stays in this browser.')}</p>
    </div>
    <div class="footCredits">
      <p>${t('با ❤️ برای مردم ایران', 'With ❤️ for the people of Iran')}</p>
      <a href="${escape(destination('designer'))}">${t('طراحی توسط صابر', 'Designed by Saber')}</a>
    </div>
    <small class="copyright">${copyright()}</small>`;
}
const depositLabel = () => t('پول پیش (رهن)', 'Deposit');
const rentLabel = () => t('اجارهٔ ماهانه', 'Monthly rent');
const fullLabel = () => t('ارزش رهن کامل', 'Full-deposit value');
const pctOpts = () => ({kind:'decimal', suffix:t('درصد','%')});
const sample = () => btn('sample', t('بارگذاری نمونه', 'Load example'), 'chip');
function renderConvert() {
  const s = state.convert;
  const split = s.mode === 'split';
  return card(t('تبدیل رهن و اجاره', 'Convert deposit and rent'), t('ببینید با کم یا زیاد کردن پول پیش، اجارهٔ ماهانه چقدر تغییر می‌کند.', 'See how paying a larger or smaller deposit changes monthly rent.'),
    group('mode', t('جهت تبدیل', 'Conversion direction'), [['split',t('اجاره‌ام چقدر می‌شود؟','How much is the rent?')],['reverse',t('رهن کاملش چقدر است؟','What is the full deposit?')]],s.mode) +
    (split ? `${intro(t('از کجا شروع کنم؟','How do I start?'),t('مبلغ رهن کامل را وارد کنید. بعد نوار را جابه‌جا کنید یا پول پیش دلخواه را بنویسید.','Enter the full deposit, then move the slider or enter the deposit you want to pay.'))}${field('full',fullLabel(),s.full,{help:t('پولی که برای گرفتن خانه بدون اجارهٔ ماهانه می‌پردازید.','The deposit you would pay with no monthly rent.')})}
      <div class="presets" aria-label="${t('مبلغ‌های نمونه','Example values')}">${[500000000,1000000000,2000000000].map(value => `<button type="button" class="chip" data-set="full" data-value="${value}" aria-pressed="${money(s.full) === BigInt(value)}">${number(value/1000000)} ${t('میلیون','million')}</button>`).join('')}</div>
      <div class="sliderBox"><div class="labelLine"><label for="share">${t('چه سهمی را پول پیش بدهید؟', 'How much to pay as a deposit?')}</label><span id="shareText"></span></div><input id="share" type="range" min="0" max="100" step="1" value="${escape(s.share)}" dir="ltr"><div class="rangeEnds" dir="ltr"><span>${t('تمام اجاره', 'All rent')}</span><span>${t('تمام رهن', 'All deposit')}</span></div></div>` : intro(t('چه عددهایی وارد کنم؟','What do I enter?'),t('پول پیش و اجارهٔ پیشنهادی را وارد کنید تا ببینید اگر فقط پول پیش بدهید، مبلغ معادل چقدر است.','Enter the proposed deposit and rent to calculate the equivalent with no monthly rent.'))) +
    `<div class="fields">${field(split ? 'deposit' : 'reverseDeposit',depositLabel(),split ? s.deposit : s.reverseDeposit)}${field(split ? 'rent' : 'reverseRent',rentLabel(),split ? s.rent : s.reverseRent)}</div>` + rateField(s.rate)) + panel();
}
function renderRenewal() {
  const s = state.renewal;
  const target = s.mode === 'target';
  return card(t('محاسبهٔ تمدید قرارداد', 'Calculate contract renewal'), t('مبلغ تمدید را از روی درصد پیشنهادی حساب کنید یا ببینید پیشنهاد جدید چند درصد فرق دارد.', 'Calculate renewal from a proposed percentage or see how much the new offer changes the total.'),
    group('mode',t('روش تمدید','Renewal method'),[['target',t('درصد تغییر را می‌دانم','I know the percentage')],['actual',t('مبلغ‌های جدید را می‌دانم','I know the new amounts')]],s.mode) +
    `<div class="stack"><div><div class="labelLine"><span>${t('قرارداد فعلی', 'Current contract')}</span>${sample()}</div><div class="fields">${field('deposit',depositLabel(),s.deposit)}${field('rent',rentLabel(),s.rent)}</div></div>
    ${target ? `<div>${field('increase',t('درصد تغییر ارزش کل قرارداد','Change in total contract value'),s.increase,pctOpts())}<p class="help">${t('درصد روی مجموع ارزش پول پیش و اجاره اعمال می‌شود. برای کاهش، درصد منفی مثل ۱۰− وارد کنید.', 'The percentage applies to the combined value of the deposit and rent. Enter a negative percentage, such as −10, for a decrease.')}</p></div>
    <div><span class="label">${t('اعمال تغییر روی','Apply change to')}</span>${group('apply',t('اعمال تغییر روی','Apply change to'),[['both',t('رهن و اجاره','Both')],['deposit',t('فقط رهن','Deposit only')],['rent',t('فقط اجاره','Rent only')]],s.apply)}</div>` :
    `<div><span class="label">${t('قرارداد جدید','New contract')}</span><div class="fields">${field('newDeposit',depositLabel(),s.newDeposit)}${field('newRent',rentLabel(),s.newRent)}</div></div>`}</div>` + rateField(s.rate)) + panel();
}
function textField(name, label, value, example, options = {}) {
  return `<label class="field" for="in-${name}"><span class="label">${label}</span><span class="fieldBox">
    <input type="text" id="in-${name}" ${options.ltr ? 'dir="ltr"' : ''} ${options.list ? 'list="counties"' : ''}
      placeholder="${escape(example)}" value="${escape(value)}" autocomplete="off" spellcheck="false" maxlength="${name === 'source' ? 2048 : 90}">
    </span></label>`;
}
const currentTariff = () => findTariff(state.fee.localRates,state.fee.county,state.fee.type,tehranDay());
const rateKey = record => JSON.stringify([record.key,record.type,record.from,record.until,record.source,record.factor,record.cap]);
function syncTariffFields() {
  $('in-factor').value = formatted(state.fee.factor,'decimal');
  $('in-cap').value = formatted(state.fee.cap,'money');
}
function matchingTariff() {
  const record = currentTariff();
  return record && percentage(record.factor) === percentage(state.fee.factor) && money(record.cap) === money(state.fee.cap) ? record : null;
}
const shownDate = value => new Intl.DateTimeFormat(locale(), {dateStyle:'medium',timeZone:'UTC'}).format(new Date(value + 'T00:00:00Z'));
function countyLookup(s) {
  const counties = [...new Set(s.localRates.map(record => record.county))];
  return `<section class="tariffLookup">
    <form id="countyForm" class="lookupForm">${textField('county',t('شهرستان محل ملک','County where the property is located'),s.county,t('مثلاً تهران','e.g. Tehran'),{list:true})}
    <button type="submit" class="quiet">${t('بازگردانی نرخ ذخیره‌شده','Restore saved rate')}</button>
    </form><datalist id="counties">${counties.map(name=>`<option value="${escape(name)}"></option>`).join('')}</datalist>
    <div id="tariffStatus" class="fieldNote" role="status"></div>
    <p class="help">${t('این دکمه نرخ قبلیِ همین مرورگر را برمی‌گرداند. برای استعلام، به اتحادیهٔ محل ملک مراجعه کنید.','This button restores rates saved in this browser. Ask your local trade authority for the applicable tariff.')}</p>
    <a class="sourceLink" href="${escape(destination('regulation'))}" target="_blank" rel="noopener noreferrer">${t('آیین‌نامه و روش تعیین تعرفه','Regulation and tariff method')}</a>
    </section>`;
}
function tariffSaveForm() {
  return `<details id="tariffSave" class="inlineDetails"><summary>${t('ذخیرهٔ تعرفه با منبع و تاریخ اعتبار','Save tariff with source and dates')}</summary>
    <p class="help">${t('بعد از استعلام، ضریب و سقف را در فرم بالا بنویسید. سپس لینک منبع و بازهٔ اعتبار را ثبت کنید تا دفعهٔ بعد خودکار پر شوند. تاریخ‌ها می‌توانند شمسی یا میلادی باشند.','Enter the confirmed coefficient and cap above, then save the source link and validity dates. Use Solar Hijri or Gregorian dates.')}</p>
    <form id="tariffForm" class="stack">
    ${textField('source',t('لینک بخشنامه یا نرخنامه','Link to the notice or tariff'),'',t('مثلاً https://example.org/rates','e.g. https://example.org/rates'),{ltr:true})}
    <div class="fields">${textField('from',t('شروع اعتبار','Valid from'),'',t('مثلاً ۱۴۰۵/۰۱/۰۱','e.g. 2026-03-21'),{ltr:true})}
    ${textField('until',t('پایان اعتبار','Valid until'),'',t('مثلاً ۱۴۰۵/۱۲/۲۹','e.g. 2027-03-20'),{ltr:true})}</div>
    <div><button type="submit" class="quiet">${t('ثبت نرخ برای این شهرستان','Save rate for this county')}</button></div>
    <p id="tariffError" class="notice" role="status"></p></form>
    </details>`;
}
function feeAmounts(s) {
  return s.type === 'sale' ? field('price',t('قیمت خرید یا فروش ملک','Agreed sale price'),s.price) :
    `<div class="fields">${field('deposit',depositLabel(),s.deposit)}${s.type === 'lease' ? field('rent',rentLabel(),s.rent) : ''}</div>`;
}
function renderTehranFee(s) {
  const offer = s.tehran;
  const source = `<a href="${escape(destination('tehran'))}" target="_blank" rel="noopener noreferrer">${t('منبع نرخنامهٔ تهران · ۱۵ شهریور ۱۴۰۵','Tehran tariff source · 6 September 2026')}</a>`;
  const fields = s.type === 'sale' ? [['sale',t('درصد از قیمت ملک','Percentage of sale price')]] :
    [['deposit',t('درصد از پول پیش','Percentage of deposit')],...(s.type === 'lease' ? [['rent',t('درصد از اجارهٔ یک ماه','Percentage of one month’s rent')]] : [])];
  const summary = s.type === 'sale' ? t('۰٫۲۵٪ قیمت ملک برای هر طرف', '0.25% of the sale price per party') :
    s.type === 'lease' ? t('۰٫۵٪ پول پیش و ۲۵٪ اجارهٔ یک ماه برای هر طرف', '0.5% of the deposit plus 25% of one month’s rent per party') :
    t('۰٫۵٪ پول پیش برای هر طرف','0.5% of the deposit per party');
  return `<div class="stack">${feeAmounts(s)}
    <div class="reference"><strong>${t('مبنای محاسبه: نرخنامهٔ صنفی تهران','Basis: reported Tehran trade tariff')}</strong><p>${summary}</p><p class="help">${t('سقف ثابتِ تأییدشده در این منبع پیدا نشد. اگر سقف قرارداد را از مرجع مربوط گرفته‌اید، آن را وارد کنید.','A verified fixed cap was unavailable. Enter a cap if the relevant authority has supplied one.')}</p>${source}</div></div>
    <details id="tehranDetails" class="inlineDetails"><summary>${t('دیدن یا تغییر درصدها، سقف و مالیات','View or change rates, cap and VAT')}</summary>
    <div class="stack"><div class="fields">${fields.map(([name,label])=>field('tehran-'+name,label,offer[name] ?? tehranReference[name],{...pctOpts(),example:tehranReference[name]})).join('')}
      ${field('tehran-cap',t('سقف کمیسیون هر دو طرف، پیش از مالیات','Fee cap for both parties before VAT'),offer.cap ?? '',{example:'4000000'})}
      ${field('tehran-vat',t('درصد مالیات','VAT percentage'),offer.vat ?? tehranReference.vat,{...pctOpts(),example:tehranReference.vat,help:t('مقدار پیش‌فرض ۱۰٪ است. مبلغ نهایی را با صورتحساب بنگاه بررسی کنید.','The default is 10%. Check your agency invoice.')} )}</div>${btn('reset-tehran',t('برگرداندن نرخ‌های پیش‌فرض','Restore default rates'),'quiet','renew')}</div></details>`;
}
function renderFee() {
  const s = state.fee;
  const official = s.mode === 'official';
  return card(t('کمیسیون بنگاه چقدر می‌شود؟','How much is the agent fee?'), t('ببینید هر طرف معامله با احتساب مالیات چقدر می‌پردازد.', 'See what each party would pay including tax.'),
    group('mode',t('روش محاسبهٔ کمیسیون','How to calculate the fee'),[['tehran',t('نرخنامهٔ تهران','Tehran rates')],['official',t('تعرفهٔ شهر من','My city tariff')],['estimate',t('درصد پیشنهادی بنگاه','Agent’s quote')]],s.mode) +
    group('type',t('نوع معامله','Transaction type'),[['sale',t('خرید و فروش','Sale')],['lease',t('رهن و اجاره','Deposit & rent')],['full',t('رهن کامل','Full deposit')]],s.type) +
    (s.mode === 'tehran' ? renderTehranFee(s) : `<div class="stack">${official ?
      `${countyLookup(s)}
      ${field('value',t('ارزش معاملاتی ملک','Property transactional value'),s.value,{help:t('مبلغی که ادارهٔ مالیات برای ملک تعیین می‌کند (مادهٔ ۶۴). آن را از مرجع مربوط بگیرید. قیمت توافقی خرید را اینجا وارد نکنید.','The tax authority’s Article 64 value. Obtain it from the relevant authority. Enter it here instead of the agreed sale price.')})}
      <div class="fields">${field('factor',t('درصد مصوب کمیسیون','Approved fee percentage'),s.factor,{...pctOpts(),help:t('درصدی که به ارزش معاملاتی اعمال می‌شود، برای مجموع دو طرف.','Percentage applied to the transactional value, for both parties combined.')})}
      ${field('cap',t('حداکثر کمیسیون دو طرف','Maximum fee for both parties'),s.cap,{help:t('اگر نرخنامه سقف تعیین کرده، مبلغ آن را وارد کنید.','Enter the maximum if the tariff specifies one.')})}</div>` :
      `${intro(t('این بخش چه کمکی می‌کند؟','What is this for?'),t('اگر بنگاه به شما درصدی گفته، آن را وارد کنید تا مبلغ تقریبی را ببینید. برای مبلغ قابل دریافت طبق قانون، «طبق تعرفهٔ شهرستان» را انتخاب کنید.','Enter the percentage quoted by the agent to see an estimate. Use the county tariff for the regulated amount.'))}
       ${s.type === 'sale' ? field('price',t('قیمت توافق‌شدهٔ ملک','Agreed sale price'),s.price) :
          `<div class="fields">${field('deposit',depositLabel(),s.deposit)}${s.type === 'lease' ? field('rent',rentLabel(),s.rent) : ''}</div><p class="help">${t('در این برآورد، پول پیش به اجاره تبدیل می‌شود و درصد روی مجموع اجارهٔ ماهانه اعمال می‌شود.','This estimate applies the percentage to monthly rent after converting the deposit to its monthly equivalent.')}</p>`}
       <div class="fields">${field('custom',t('درصد پیشنهادی بنگاه','Quoted fee percentage'),s.custom,pctOpts())}${select('quote',t('بنگاه این درصد را برای چه کسی گفته؟','Who does this percentage apply to?'),[['total',t('مجموع دو طرف','Both parties combined')],['side',t('هر طرف جداگانه','Each party separately')]],s.quote)}</div>`}
    ${field('vat',t('نرخ مالیات بر ارزش افزوده','VAT rate'),s.vat,{...pctOpts(),help:t('نرخ معتبر را از صورتحساب یا مرجع مربوط بگیرید. اگر مالیات اعمال نمی‌شود، صفر وارد کنید.','Use the applicable rate from the invoice or relevant authority. Enter zero if no tax applies.')})}</div>` +
    (official ? tariffSaveForm() : s.type !== 'sale' ? rateField(s.rate) : ''))) + panel();
}
function updateTariffStatus() {
  const info = $('tariffStatus');
  if (!info) return;
  const record = matchingTariff();
  const source = record && httpsSource(record.source);
  const message = source ?
    `<strong>${t('تعرفه از نرخ ذخیره‌شده پر شد.','Tariff loaded from your saved rate.')}</strong> ${t('اعتبار','Valid')} ${shownDate(record.from)} ${t('تا','to')} ${shownDate(record.until)} · <a target="_blank" rel="noopener noreferrer" href="${escape(source)}">${t('منبع ثبت‌شده','Saved source')}</a>` :
    currentTariff() ? t('مبلغ یا درصد را دستی تغییر داده‌اید. برای برگشت به نرخ ذخیره‌شده، «بازگردانی نرخ ذخیره‌شده» را بزنید.','You edited the saved figures. Choose Restore saved rate to restore them.') :
    state.fee.county ? t('برای این شهرستان و نوع قرارداد، تعرفهٔ معتبرِ ذخیره‌شده در دسترس نیست. اعداد استعلام‌شده را دستی وارد کنید.','There is no current saved tariff for this county and contract type. Enter the figures you obtained from the relevant authority.') :
    t('برای شروع، نام شهرستان محل ملک را بنویسید.','Start by entering the county where the property is located.');
  $('countyForm').querySelector('button').disabled = !currentTariff();
  if (info.innerHTML !== message) info.innerHTML = message;
}
function applyTariff() {
  const record = currentTariff();
  if (record) Object.assign(state.fee,{factor:record.factor,cap:record.cap,loadedRate:rateKey(record)});
  else if (state.fee.loadedRate) Object.assign(state.fee,{factor:'',cap:'',loadedRate:null});
}
function selectCounty(value) {
  const county = value.trim();
  if (countyKey(state.fee.county) !== countyKey(county)) {
    state.fee.tariffs = {};
    if (state.fee.county) Object.assign(state.fee,{factor:'',cap:'',loadedRate:null});
  }
  state.fee.county = county;
  applyTariff();
}
function renderCompare() {
  const s = state.compare;
  return card(t('مقایسهٔ پیشنهادهای اجاره','Compare rental offers'), t('برای هر خانه، پول پیش و اجاره را بنویسید. ببینید کدام گزینه در کل قرارداد به‌صرفه‌تر است.', 'Enter the deposit and rent for each home to see which costs less over the lease.'),
    `<div class="compareSettings">
      <div><h3>${t('تنظیمات مشترک','Shared settings')}</h3><p class="help">${t('برای همهٔ پیشنهادها اعمال می‌شود.','Applies to all offers.')}</p></div>
      <div class="fields">${field('months',t('مدت قرارداد','Contract term'),s.months,{kind:'int',suffix:t('ماه','months')})}${field('rate',t('اجارهٔ هر یک میلیون تومان رهن','Rent per million of deposit'),s.rate)}</div>
    </div>
    <div class="compareSectionHead"><h3>${t('پیشنهادهای اجاره','Rental offers')}</h3>
      <div class="resultActions">${sample()}${s.offers.length < 3 ? btn('add-offer',t('افزودن پیشنهاد','Add offer'),'quiet','plus') : ''}</div>
    </div>
    <div class="scenarios">${s.offers.map((offer,i)=>`<section class="scenario" aria-labelledby="offer-${i}">
      <div class="scenarioHead"><h4 id="offer-${i}">${t('پیشنهاد','Offer')} ${number(i+1)}</h4>${i === 2 ? btn('remove-offer',t('حذف پیشنهاد سوم','Remove third offer')) : ''}</div>
      <div class="stack">${field(`offer-${i}-deposit`,depositLabel(),offer.deposit)}${field(`offer-${i}-rent`,rentLabel(),offer.rent)}${field(`offer-${i}-fee`,t('هزینهٔ یک‌باره','One-time fees'),offer.fee,{help:t('اختیاری، مثل سهم شما از کمیسیون بنگاه.','Optional, such as your share of the agent fee.'),example:i===0?'5000000':'6000000'})}</div>
    </section>`).join('')}</div>`, true) +
    `<article class="card glass wide compareResult resultStage"><div class="stageBar">${step(true,'calc')}</div><div class="compareSectionHead">
      <div class="resultTitle"><h2 id="result-heading" tabindex="-1">${t('نتیجهٔ مقایسه','Comparison result')}</h2></div>
    </div>${warningsPanel()}<div id="result" aria-live="polite"></div>${resultActions()}</article>`;
}
const views = { convert: renderConvert, renewal: renderRenewal, fee: renderFee, compare: renderCompare };
function render(keepRate = false) {
  $('workspace').classList.toggle('compareWorkspace', state.tab === 'compare');
  $('workspace').innerHTML = views[state.tab]();
  if (keepRate && $('rateDetails')) $('rateDetails').open = true;
  $('nav').querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', button.dataset.tab === state.tab));
  calculate();
}

let issue = '';
const warnings = new Map();
function warn(title, message, source = '') {
  warnings.set(title,{message,source});
}
function warningMarkup() {
  return [...warnings].map(([title,{message,source}])=>`<div class="warning">${icon('warning')}<div><strong>${title}</strong><p>${message}</p>${source ? `<a href="${escape(source)}" target="_blank" rel="noopener noreferrer">${t('دیدن منبع و شرایط','See source and conditions')}</a>` : ''}</div></div>`).join('');
}
function flag(name, message) {
  const input = $('in-' + name);
  if (input) input.setAttribute('aria-invalid', 'true');
  const caption = $('hint-' + name);
  if (caption) caption.textContent = message;
  issue ||= message;
  return null;
}
const blank = raw => normalize(raw ?? '') === '';
const invalidMoney = () => t('یک مبلغ صحیح و غیرمنفی تا ۱۵ رقم وارد کنید.', 'Enter a non-negative whole amount of up to 15 digits.');
function readMoney(name, raw, optional = false) {
  if (blank(raw)) return optional ? 0n : null;
  return money(raw) ?? flag(name, invalidMoney());
}
function readRate(raw) {
  const value = money(raw);
  if (value === null || value === 0n || value > MILLION) return flag('rate', t('نرخ تبدیل باید بین ۱ و ۱٬۰۰۰٬۰۰۰ تومان باشد.', 'Enter a conversion rate from 1 to 1,000,000 toman.'));
  if (value < 10000n || value > 50000n) warn(t('نرخ تبدیل را دوباره بررسی کنید','Double-check the conversion rate'),
    t('برای هر یک میلیون تومان رهن، کمتر از ۱۰ هزار یا بیشتر از ۵۰ هزار تومان اجاره وارد کرده‌اید. این بازه فقط برای تشخیص خطای ورود عدد است.','You entered under 10,000 or over 50,000 toman of rent per million of deposit. This range is a data-entry check.'));
  return value;
}
function readPercent(name, raw, min, max) {
  if (blank(raw)) return null;
  const value = percentage(raw);
  if (value === null || value < min || value > max) return flag(name, t(`درصدی بین ${percent(min)} و ${percent(max)} با حداکثر چهار رقم اعشار وارد کنید.`, `Enter a percentage from ${percent(min)} to ${percent(max)} with up to four decimal places.`));
  return value;
}
function setInput(name, value) {
  const node = $('in-' + name);
  if (node && document.activeElement !== node) node.value = value === null ? '' : number(value);
}
function show(html, lines, primary = null) {
  report = { html, lines, primary };
}
const withLabel = (label, value) => `${label} · ${value}`;
const equivalentLabel = () => t('ارزش معادل رهن کامل','Full-deposit equivalent');
const rateLabel = () => t('اجاره ماهانه به‌ازای یک میلیون تومان رهن','Monthly rent per million of deposit');
function convert() {
  const s = state.convert;
  const rate = readRate(s.rate);
  let deposit, rent, full;
  if (s.mode === 'reverse') {
    deposit = readMoney('reverseDeposit', s.reverseDeposit, !blank(s.reverseRent));
    rent = readMoney('reverseRent', s.reverseRent, !blank(s.reverseDeposit));
    if (rate === null || deposit === null || rent === null) return;
    full = equivalent(deposit, rent, rate);
  } else {
    full = readMoney('full', s.full);
    const sharing = $('share');
    sharing.disabled = full === null || full === 0n || rate === null;
    const share = Math.min(100, Math.max(0, Number(s.share) || 0));
    $('shareText').textContent = percent(BigInt(share) * 10_000n);
    sharing.setAttribute('aria-valuetext', $('shareText').textContent);
    if (full === null || rate === null) {
      setInput('deposit', s.anchor === 'deposit' ? money(s.deposit) : null);
      setInput('rent', s.anchor === 'rent' ? money(s.rent) : null);
      return;
    }
    if (s.anchor === 'deposit') {
      deposit = readMoney('deposit', s.deposit);
      if (deposit !== null && deposit > full) deposit = flag('deposit', t('مبلغ رهن نمی‌تواند از رهن کامل بیشتر باشد.', 'Deposit cannot exceed the full-deposit value.'));
    } else if (s.anchor === 'rent') {
      rent = readMoney('rent', s.rent);
      const maximum = monthlyFromFull(full, rate);
      if (rent !== null && rent > maximum) rent = flag('rent', t(`اجارهٔ ماهانه نمی‌تواند از ${amount(maximum)} بیشتر باشد.`, `Monthly rent cannot exceed ${amount(maximum)}.`));
      if (rent !== null) {
        const assigned = fullFromMonthly(rent, rate);
        deposit = full > assigned ? full - assigned : 0n;
      }
    } else {
      deposit = divide(full * BigInt(share), 100n);
    }
    if (s.anchor !== 'rent') rent = deposit == null ? null : monthlyFromFull(full - deposit, rate);
    if (s.anchor !== 'deposit') setInput('deposit', deposit ?? null);
    if (s.anchor !== 'rent') setInput('rent', rent ?? null);
    if (deposit == null || rent == null) return;
    const currentShare = s.anchor === 'share' || full === 0n ? share : Number(divide(deposit * 100n, full));
    sharing.value = currentShare;
    $('shareText').textContent = percent(BigInt(currentShare) * 10_000n);
    sharing.setAttribute('aria-valuetext', $('shareText').textContent);
  }
  const reversed = s.mode === 'reverse';
  const lead = reversed ? [equivalentLabel(), full] : [rentLabel(), rent];
  const other = reversed ? [[depositLabel(),deposit],[rentLabel(),rent]] : [[depositLabel(),deposit],[fullLabel(),full]];
  show(metric(...lead, true) + `<div class="figures">${other.map(entry => metric(...entry)).join('')}</div>` +
    row(rateLabel(), amount(rate)) +
    `<p class="note">${reversed ? t('مبلغ رهن و معادلِ رهنِ اجارهٔ ماهانه با هم جمع می‌شوند.','Add the deposit to the deposit equivalent of the monthly rent.') : t('هر بخش از رهن کامل که پرداخت نشود، به اجارهٔ ماهانه تبدیل می‌شود.','The portion of the full deposit that is left unpaid converts to monthly rent.')}</p>`,
    [lead,...other,[rateLabel(),rate]].map(([label,value])=>withLabel(label,amount(value))), { deposit, rent });
}
function warnRenewal(high) {
  const date = tehranDay();
  const active = date >= renewalReference.start && date <= renewalReference.end;
  warn(t('افزایش بیشتر از ۲۵٪','Increase above 25%'), high.join(' · ') + '. ' + (active ?
    t('مصوبهٔ ۱۴۰۵ برای تمدید مشمولِ اجارهٔ مسکونی، با درخواست مستأجر، سقف ۲۵٪ برای اجاره و پول پیش دارد. شرایط و استثناها را ببینید.', 'The 1405 rule caps increases in rent and deposit at 25% for qualifying residential renewals requested by the tenant. Check conditions and exceptions.') :
    t('۲۵٪ در اینجا فقط معیار مقایسه با مصوبهٔ ۱۴۰۵ است. مقررات تاریخ قرارداد را جداگانه بررسی کنید.', '25% is a reference to the 1405 rule. Check the rules for your contract dates.')),destination('renewal'));
}
function renewal() {
  const s = state.renewal;
  const rate = readRate(s.rate);
  const deposit = readMoney('deposit', s.deposit, !blank(s.rent));
  const rent = readMoney('rent', s.rent, !blank(s.deposit));
  let revised;
  if (s.mode === 'target') {
    const increase = readPercent('increase', s.increase, -PERCENT, 10n * PERCENT);
    if (increase !== null && increase > renewalReference.threshold)
      warnRenewal([withLabel(t('درصد واردشده','Entered increase'),percent(increase))]);
    if (rate === null || deposit === null || rent === null || increase === null) return;
    if (deposit === 0n && rent === 0n) {
      issue = t('برای محاسبهٔ درصد تغییر، ارزش قرارداد فعلی باید بیشتر از صفر باشد.', 'The current contract must have a positive value to calculate a percentage change.');
      return;
    }
    revised = renew(deposit, rent, rate, increase, s.apply);
    if (revised.impossible) {
      flag('increase', t('با ثابت ماندن مبلغ دیگر، این درصد مبلغی منفی می‌سازد. روش اعمال یا درصد را تغییر دهید.', 'This percentage would make one amount negative while the other is fixed. Change the percentage or how it is applied.'));
      return;
    }
  } else {
    revised = { deposit: readMoney('newDeposit', s.newDeposit, !blank(s.newRent)), rent: readMoney('newRent', s.newRent, !blank(s.newDeposit)) };
    if (rate === null || deposit === null || rent === null || revised.deposit === null || revised.rent === null) return;
  }
  const before = deposit * rate + rent * MILLION;
  const after = revised.deposit * rate + revised.rent * MILLION;
  const change = growthPercent(after - before, before);
  const labels = [t('پول پیش','Deposit'),t('اجارهٔ ماهانه','Monthly rent'),t('ارزش معادل کل','Overall equivalent value')];
  const changes = renewalChanges(deposit,rent,revised.deposit,revised.rent,before,after);
  const high = changes.flatMap(([over,value],i)=>over ? [withLabel(labels[i],percent(value))] : []);
  if (high.length) warnRenewal(high);
  const oldValue = equivalent(deposit, rent, rate);
  const newValue = equivalent(revised.deposit, revised.rent, rate);
  const label = t('ارزش معادل قرارداد جدید','New full-deposit equivalent');
  const newDepositLabel = t('پول پیش جدید','New deposit');
  const newRentLabel = t('اجارهٔ جدید در ماه','New monthly rent');
  const changeLabel = t('تغییر هزینهٔ کل قرارداد','Change in total contract value');
  const changeText = change === null ? t('قرارداد فعلی صفر است','Current contract is zero') : percent(change);
  const lead = s.mode === 'actual'
    ? `<div class="resultMain"><span>${changeLabel}</span><strong dir="auto">${changeText}</strong></div>`
    : metric(newRentLabel,revised.rent,true);
  const rows = [
    [t('ارزش معادل قرارداد فعلی','Current full-deposit equivalent'),amount(oldValue)],
    [s.mode === 'actual' ? label : changeLabel,s.mode === 'actual' ? amount(newValue) : changeText],
    [t('تفاوت مبلغ رهن','Deposit difference'),signed(revised.deposit - deposit)],
    [t('تفاوت اجارهٔ ماهانه','Monthly rent difference'),signed(revised.rent - rent)],
    [rateLabel(),amount(rate)]
  ];
  show(lead + `<div class="figures">${metric(newDepositLabel,revised.deposit)}${s.mode === 'actual' ? metric(newRentLabel,revised.rent) : metric(label,newValue)}</div>` + rows.map(entry=>row(...entry)).join(''),
    [[newDepositLabel,amount(revised.deposit)],[newRentLabel,amount(revised.rent)],s.mode === 'actual' ? [changeLabel,changeText] : [label,amount(newValue)],...rows].map(entry=>withLabel(...entry)));
}
function fee() {
  const s = state.fee;
  if (s.mode === 'tehran') return calculateTehranFee(s);
  const official = s.mode === 'official';
  const vat = readPercent('vat', s.vat, 0n, PERCENT);
  const factor = readPercent(official ? 'factor' : 'custom', official ? s.factor : s.custom, 0n, PERCENT);
  let numerator, denominator = 1n, cap = null, conversionRate = null;
  let basis = '';
  if (official) {
    numerator = readMoney('value', s.value);
    if (!blank(s.cap)) cap = readMoney('cap', s.cap);
    basis = t('ارزش معاملاتی مادهٔ ۶۴','Article 64 transactional value');
  } else if (s.type === 'sale') {
    numerator = readMoney('price', s.price);
    basis = t('قیمت معامله','Sale price');
  } else {
    const rate = readRate(s.rate);
    const deposit = readMoney('deposit', s.deposit, s.type === 'lease' && !blank(s.rent));
    const rent = s.type === 'full' ? 0n : readMoney('rent', s.rent, !blank(s.deposit));
    if (rate !== null && deposit !== null && rent !== null) numerator = deposit * rate + rent * MILLION;
    denominator = MILLION;
    conversionRate = rate;
    basis = t('اجارهٔ ماهانهٔ معادل', 'Equivalent monthly rent');
  }
  if (official && currentTariff() && !matchingTariff()) warn(t('تعرفه را تغییر دادید','You changed the saved tariff'), t('نتیجه با درصد یا سقف جدید حساب می‌شود. برای برگشت، «بازگردانی نرخ ذخیره‌شده» را بزنید.','The result uses your edited figures. Restore the saved rate to undo the changes.'));
  if (!official && s.type === 'sale' && factor !== null && factor * (s.quote === 'side' ? 2n : 1n) > 5000n) warn(t('درصد پیشنهادی بالاتر از نرخ مرجع تهران است','Quote exceeds the Tehran reference'),t('برای خرید و فروش، نرخنامهٔ گزارش‌شدهٔ تهران ۰٫۵٪ در مجموع دو طرف است. تعرفهٔ محل ملک را بررسی کنید.','The reported Tehran sale tariff is 0.5% for both parties combined. Check the applicable local tariff.'),destination('tehran'));
  if (issue || numerator == null || factor === null || vat === null) return;
  const values = commission(numerator, denominator, factor, vat, !official && s.quote === 'side', cap);
  const label = t('پرداختی کل دو طرف','Total payable by both parties');
  const first = s.type === 'sale' ? t('سهم خریدار','Buyer’s share') : t('سهم مستأجر','Tenant’s share');
  const second = s.type === 'sale' ? t('سهم فروشنده','Seller’s share') : t('سهم موجر','Landlord’s share');
  const rows = [
    [basis, amount(divide(numerator,denominator))],
    ...(conversionRate !== null ? [[rateLabel(),amount(conversionRate)]] : []),
    [!official && s.quote === 'side' ? t('درصد برآورد برای هر طرف','Estimate percentage per party') : t('ضریب واردشده برای دو طرف','Entered coefficient for both parties'),percent(factor)],
    ...(cap !== null ? [[t('سقف تعرفهٔ کل','Total fee cap'),amount(cap)]] : []),
    [t('حق‌الزحمهٔ پایهٔ کل','Total base fee'),amount(values.subtotal)],
    [t('مالیات بر ارزش افزوده','VAT') + ` (${percent(vat)})`, amount(values.tax)]
  ];
  const record = official ? matchingTariff() : null;
  const provenance = record ? [t('منبع تعرفه و پایان اعتبار','Tariff source and expiry'), `${record.source} · ${shownDate(record.until)}`] : null;
  const note = official ? t('محاسبه با فرض تقسیم برابر بین دو طرف. اعتبار اعداد ورودی را با منبع تعرفه بررسی کنید.', 'The fee is split equally. Check your figures against the tariff source.') : t('برآورد دستی با فرض تقسیم برابر بین طرفین.', 'Manual estimate assuming an equal split.');
  show(metric(label,values.total,true) + `<div class="figures">${metric(first,values.first)}${metric(second,values.second)}</div>` +
    rows.map(entry=>row(...entry)).join('') + `<p class="note">${note}</p>`,
    [[label,amount(values.total)],[first,amount(values.first)],[second,amount(values.second)],...rows].map(entry=>withLabel(...entry)).concat(provenance ? [withLabel(...provenance),note] : [note]));
}
function calculateTehranFee(s) {
  const names = s.type === 'sale' ? ['sale'] : s.type === 'lease' ? ['deposit','rent'] : ['deposit'];
  const rates = Object.fromEntries([...names,'vat'].map(name=>[name,readPercent('tehran-'+name,s.tehran[name] ?? tehranReference[name],0n,PERCENT)]));
  const cap = blank(s.tehran.cap) ? null : readMoney('tehran-cap',s.tehran.cap);
  const edited = [...names,'vat'].some(name=>rates[name] !== percentage(tehranReference[name])) || !blank(s.tehran.cap);
  if (edited) warn(t('مبنای محاسبه را تغییر دادید','You changed the calculation basis'),
    t('این نتیجه با درصد، سقف یا مالیات دلخواه شما حساب می‌شود. برای برگشت، «برگرداندن نرخ‌های پیش‌فرض» را بزنید.','The result uses your override. Choose Restore default rates to undo the override.'),destination('tehran'));
  const amounts = s.type === 'sale' ? {price:readMoney('price',s.price)} : {
    deposit:readMoney('deposit',s.deposit,s.type === 'lease' && !blank(s.rent)),
    rent:s.type === 'full' ? 0n : readMoney('rent',s.rent,!blank(s.deposit))
  };
  if (issue || Object.values(amounts).some(value=>value === null) || Object.values(rates).some(value=>value === null)) return;
  const values = tehranFee(s.type,amounts,rates,rates.vat,cap);
  const resultLabel = t('مجموع پرداخت دو طرف','Total paid by both parties');
  const first = s.type === 'sale' ? t('سهم خریدار','Buyer’s share') : t('سهم مستأجر','Tenant’s share');
  const second = s.type === 'sale' ? t('سهم فروشنده','Seller’s share') : t('سهم موجر','Landlord’s share');
  const rows = [
    [t('کمیسیون دو طرف قبل از مالیات','Fee before VAT'),amount(values.subtotal)],
    [t('مالیات','VAT') + ` (${percent(rates.vat)})`,amount(values.tax)],
    [t('سقف ثابت کمیسیون','Fixed fee cap'),cap === null ? t('تأیید نشده و اعمال نشده','Unverified and not applied') : amount(cap)]
  ];
  show(metric(resultLabel,values.total,true) + `<div class="figures">${metric(first,values.first)}${metric(second,values.second)}</div>` + rows.map(entry=>row(...entry)).join(''),
    [[resultLabel,amount(values.total)],[first,amount(values.first)],[second,amount(values.second)],...rows].map(entry=>withLabel(...entry)).concat(destination('tehran')));
}
function compare() {
  const s = state.compare;
  const rate = readRate(s.rate);
  const months = money(s.months);
  if (months === null || months < 1n || months > 120n) flag('months',t('مدت قرارداد باید بین ۱ و ۱۲۰ ماه باشد.','Enter a term from 1 to 120 months.'));
  const offers = s.offers.map((offer,i) => {
    if (blank(offer.deposit) && blank(offer.rent) && blank(offer.fee)) return null;
    const deposit = readMoney(`offer-${i}-deposit`,offer.deposit,true);
    const rent = readMoney(`offer-${i}-rent`,offer.rent,true);
    const fee = readMoney(`offer-${i}-fee`,offer.fee,true);
    if (issue || deposit === null || rent === null || fee === null) return null;
    return { i, deposit, rent, fee, ...scenario(deposit,rent,fee,months,rate) };
  }).filter(Boolean);
  if (issue || offers.length < 2) return;
  const sorted = [...offers].sort((a,b)=>a.comparable === b.comparable ? 0 : a.comparable < b.comparable ? -1 : 1);
  const cheapest = sorted[0].comparable;
  if (cheapest > 0n && sorted.at(-1).comparable >= cheapest * 2n) warn(t('اختلاف پیشنهادها زیاد است','The offers differ substantially'),
    t('هزینهٔ گران‌ترین پیشنهاد دست‌کم دو برابر ارزان‌ترین است. واحد تومان و تعداد صفرها را دوباره چک کنید.','The most expensive offer is at least twice the cheapest. Double-check the currency unit and number of digits.'));
  const offerName = i => `${t('پیشنهاد','Offer')} ${number(i+1)}`;
  const winner = sorted.filter(offer=>offer.comparable===cheapest).map(offer=>offerName(offer.i)).join(t(' و ',' and '));
  const totalLabel = t('هزینهٔ مقایسه‌ای','Comparable cost');
  const cashLabel = t('هزینهٔ نقدی دوره','Cash cost over term');
  const note = t('هزینهٔ نقدی شامل اجارهٔ دوره و هزینهٔ یک‌باره است. هزینهٔ مقایسه‌ای، معادل اجارهٔ مبلغ رهن را هم لحاظ می‌کند. اصل رهن جداگانه نمایش داده شده است.', 'Cash cost includes rent over the term and one-time fees. Comparable cost also includes the rental equivalent of the deposit. Deposit principal is shown separately.');
  show(`<div class="resultMain compareSummary"><div><span>${t('کمترین هزینهٔ مقایسه‌ای','Lowest comparable cost')}</span><strong>${winner}</strong></div><b dir="auto">${amount(cheapest)}</b></div>
    ${row(t('مدت قرارداد','Contract term'), `${number(months)} ${t('ماه','months')}`)}${row(rateLabel(), amount(rate))}
    <div class="scenarios">${offers.map(offer=>`<article class="scenario ${offer.comparable === cheapest ? 'bestOffer' : ''}"><h3>${offerName(offer.i)}</h3>${row(totalLabel,amount(offer.comparable))}${row(cashLabel,amount(offer.cash))}${row(depositLabel(),amount(offer.deposit))}${row(t('اختلاف با کمترین هزینه','Above lowest cost'),amount(offer.comparable-cheapest))}</article>`).join('')}</div><p class="note">${note}</p>`,
    [withLabel(t('کمترین هزینهٔ مقایسه‌ای','Lowest comparable cost'),winner),withLabel(t('مدت','Term'),`${number(months)} ${t('ماه','months')}`),withLabel(rateLabel(),amount(rate)),...offers.map(offer=>`${offerName(offer.i)} · ${withLabel(totalLabel,amount(offer.comparable))} · ${withLabel(cashLabel,amount(offer.cash))} · ${withLabel(depositLabel(),amount(offer.deposit))}`),note]);
}
const calculators = {convert,renewal,fee,compare};
function showSteps() {
  const steps = [
    [t('انتخاب محاسبه‌گر', 'Choose a calculator'), 'nav'],
    [t('وارد کردن مبلغ‌ها', 'Enter amounts'), 'workspace'],
    [t('نتیجه و دریافت خروجی', 'Review and export'), 'result-heading']
  ];
  $('steps').innerHTML = steps.map(([title, id], index) =>
    `<li><a href="#${id}" ${index === (report ? 2 : 1) ? 'aria-current="step"' : ''}>
    <span aria-hidden="true">${number(index + 1)}</span>${title}</a></li>`).join('');
}
let exporting = false;
async function exportResult(format) {
  if (exporting || !report) return;
  exporting = true;
  const card = document.querySelector('.resultStage');
  const snapshot = card.cloneNode(true);
  snapshot.querySelector('.resultActions')?.remove();
  const brand = document.createElement('footer');
  brand.className = 'exportBrand';
  const credit = document.createElement('strong');
  credit.textContent = raw('© ملک‌سنج · همهٔ حقوق محفوظ است.', '© Melksanj · All rights reserved.');
  const origin = document.createElement('span');
  origin.dir = 'ltr';
  origin.textContent = location.hostname;
  brand.append(credit, origin);
  snapshot.append(brand);
  const sources = [...new Set([
    ...[...warnings.values()].map(({source}) => source),
    ...(state.tab === 'fee' && state.fee.mode === 'official' ? [matchingTariff()?.source] : []),
    ...(state.tab === 'fee' && state.fee.mode === 'tehran' ? [destination('tehran')] : [])
  ].filter(Boolean))];
  if (sources.length) {
    const references = document.createElement('div');
    references.className = 'exportSources';
    for (const url of sources) {
      const line = document.createElement('p');
      line.textContent = url;
      references.append(line);
    }
    brand.before(references);
  }
  const width = card.getBoundingClientRect().width;
  const refresh = () => $('workspace').querySelectorAll('[data-action^=export-]').forEach(button => button.disabled = exporting || !report);
  refresh();
  try {
    const { downloadResult } = await import('./result-export.mjs');
    await downloadResult(snapshot, { width, format });
  } catch (error) {
    console.error('Melksanj export failed', error);
    notify(t('خروجی ساخته نشد. دوباره تلاش کنید.', 'Could not create the export. Try again.'));
  } finally {
    exporting = false;
    refresh();
  }
}
function calculate() {
  issue = '';
  warnings.clear();
  report = null;
  $('workspace').querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  $('workspace').querySelectorAll('[id^=hint-]').forEach(note => note.textContent = '');
  if ($('tariffStatus') && state.fee.loadedRate) {
    const record = currentTariff();
    if (!record || rateKey(record) !== state.fee.loadedRate) {
      applyTariff();
      syncTariffFields();
      persist();
    }
  }
  calculators[state.tab]();
  updateTariffStatus();
  const rateSummary = $('rateSummary');
  if (rateSummary) {
    const rate = money(state[state.tab].rate);
    rateSummary.textContent = rate === null || rate === 0n || rate > MILLION ? t('تنظیم نرخ تبدیل','Adjust conversion rate') : t(`نرخ تبدیل ${amount(rate)} برای هر یک میلیون رهن`, `Conversion rate ${amount(rate)} per million of deposit`);
  }
  $('error').innerHTML = issue ? `${icon('warning')}<div><strong>${t('این عدد را بررسی کنید','Check this value')}</strong><p>${escape(issue)}</p></div>` : '';
  const notices = warningMarkup();
  if ($('warnings').innerHTML !== notices) $('warnings').innerHTML = notices;
  const empty = ({
    convert: state.convert.mode === 'split' ? t('برای شروع، مبلغ رهن کامل را در فرم بنویسید یا یکی از مبلغ‌های نمونه را بزنید.','Enter the full deposit or choose an example amount.') : t('پول پیش، اجاره یا هر دو را وارد کنید.','Enter the deposit, rent, or both.'),
    renewal: state.renewal.mode === 'target' ? t('پول پیش و اجارهٔ فعلی و درصد تغییر را وارد کنید.','Enter the current deposit, rent, and percentage change.') : t('پول پیش و اجارهٔ هر دو قرارداد را وارد کنید.','Enter the deposit and monthly rent for both contracts.'),
    fee: state.fee.mode === 'tehran' ? t('مبلغ معامله را بنویسید. سهم هر نفر همین‌جا نمایش داده می‌شود.','Enter your transaction amount to see each person’s share.') : t('مبلغ و نرخ لازم را در فرم وارد کنید تا سهم هر نفر مشخص شود.','Enter the amount and applicable rate to see each party’s share.'),
  })[state.tab];
  const compareEmpty = t('حداقل دو پیشنهاد را وارد کنید تا قابل مقایسه باشند.', 'Enter at least two offers to compare them.');
  const corrected = t('پس از اصلاح ورودی، نتیجه دوباره محاسبه می‌شود.', 'The result will update when the input is corrected.');
  const html = report?.html ?? `<div class="empty">${issue ? corrected : state.tab === 'compare' ? compareEmpty : empty}</div>`;
  if ($('result').innerHTML !== html) $('result').innerHTML = html;
  $('workspace').querySelectorAll('[data-action=copy],[data-action=save],[data-action^=export-]').forEach(button =>
    button.disabled = !report || (exporting && button.dataset.action.startsWith('export-')));
  if ($('steps').dataset.ready !== String(Boolean(report))) {
    $('steps').dataset.ready = Boolean(report);
    showSteps();
  }
}

function inputsChanged(input) {
  const fieldName = input.dataset.field;
  const working = state[state.tab];
  const raw = normalize(input.value);
  const offset = normalize(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
  const grouped = formatted(raw, input.dataset.kind);
  if (grouped !== input.value) {
    input.value = grouped;
    const caret = caretAt(grouped, offset);
    input.setSelectionRange(caret, caret);
  }
  if (fieldName.startsWith('tehran-')) {
    working.tehran[fieldName.slice(7)] = raw;
  } else if (fieldName.startsWith('offer-')) {
    const [,index,part] = fieldName.split('-');
    working.offers[Number(index)][part] = raw;
  } else {
    working[fieldName] = raw;
    if (state.tab === 'fee' && ['factor','cap'].includes(fieldName)) working.loadedRate = null;
    if (state.tab === 'convert' && working.mode === 'split' && ['deposit','rent'].includes(fieldName)) working.anchor = fieldName;
  }
  if (state.tab === 'convert' && fieldName === 'full') {
    $('workspace').querySelectorAll('[data-set=full]').forEach(button=>button.setAttribute('aria-pressed',money(raw) === BigInt(button.dataset.value)));
  }
  persist();
  calculate();
}
$('workspace').addEventListener('input', event => {
  const input = event.target;
  if (event.isComposing) return;
  if (input.id === 'in-county') updateCountyInput(input);
  if (input.matches('[data-field]')) inputsChanged(input);
  if (input.id === 'share') {
    state.convert.anchor = 'share';
    state.convert.share = Number(input.value);
    persist();
    calculate();
  }
});
$('workspace').addEventListener('compositionend', event => {
  if (event.target.id === 'in-county') updateCountyInput(event.target);
  if (event.target.matches('[data-field]')) inputsChanged(event.target);
});
$('workspace').addEventListener('beforeinput', event => {
  const input = event.target;
  if (!input.matches('[data-field]') || input.selectionStart !== input.selectionEnd || !event.cancelable) return;
  const caret = input.selectionStart;
  const backward = event.inputType === 'deleteContentBackward';
  const forward = event.inputType === 'deleteContentForward';
  const adjacent = input.value[backward ? caret - 1 : caret];
  if ((!backward && !forward) || !adjacent || !separator.test(adjacent)) return;
  const start = backward ? caret - 2 : caret;
  event.preventDefault();
  input.setRangeText('', start, start + 2, 'end');
  inputsChanged(input);
});
$('workspace').addEventListener('focusout', event => {
  const input = event.target;
  if (!input.matches('[data-field]')) return;
  input.value = formatted(input.value, input.dataset.kind);
});
$('workspace').addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('[data-select]')) return;
  state[state.tab][input.dataset.select] = input.value;
  persist();
  calculate();
});

let toastTimer;
function notify(message) {
  $('toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').textContent = '', 2800);
}
function reportText() {
  return [t('ملک‌سنج','Melksanj'),tabs()[state.tab][0], ...report.lines,...[...warnings].map(([title,{message,source}])=>[title,message,source].filter(Boolean).join(' · '))].join('\n');
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    notify(t('نتیجه کپی شد.','Result copied.'));
  } catch {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly','');
    box.style.cssText = 'position:fixed;inset-inline-start:-9999px';
    const active = document.activeElement;
    ($('history').open ? $('history') : document.body).append(box);
    box.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch {}
    box.remove();
    active?.focus();
    if (copied) notify(t('نتیجه کپی شد.','Result copied.'));
    else notify(t('مرورگر اجازهٔ کپی نداد. نتیجه را می‌توانید دستی انتخاب کنید.','The browser did not allow copying. You can select the result manually.'));
  }
}
function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function history() {
  const dialog = $('history');
  dialog.setAttribute('aria-labelledby','history-title');
  dialog.innerHTML = `<div class="dialogHead"><h2 id="history-title">${t('سوابق محاسبه','Saved calculations')}</h2>
  <button class="quiet iconOnly" aria-label="${t('بستن','Close')}" data-action="close-history" autofocus>${icon('close')}</button></div>
  ${state.saved.length ? state.saved.map(item => `<article class="saved"><h3>${escape(tabs()[item.tab]?.[0] ?? '')}</h3>
  <small>${new Date(item.date).toLocaleString(locale())}</small><p>${escape(item.text)}</p><div class="presets">
  ${btn('copy-item:'+escape(item.id),t('کپی','Copy'))}${btn('remove-item:'+escape(item.id),t('حذف','Delete'))}</div></article>`).join('') :
  `<p class="empty">${t('با «ذخیره نتیجه» یک محاسبه را به سوابق اضافه کنید.','Use Save result to add a calculation to history.')}</p>`}`;
  if (!dialog.open) dialog.showModal();
}
function updateView(selector) {
  render(Boolean($('rateDetails')?.open));
  if (selector) $('workspace').querySelector(selector)?.focus({ preventScroll: true });
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.tab) {
    state.tab = button.dataset.tab;
    persist();
    render();
    return;
  }
  if (button.dataset.set) {
    const { set, value } = button.dataset;
    const group = state[state.tab];
    if (state.tab === 'convert' && set === 'mode' && value === 'reverse' && group.mode !== value &&
        blank(group.reverseDeposit) && blank(group.reverseRent) && report?.primary) {
      group.reverseDeposit = String(report.primary.deposit);
      group.reverseRent = String(report.primary.rent);
    }
    if (state.tab === 'fee' && set === 'type' && group.type !== value) {
      if (!group.loadedRate) group.tariffs[group.type] = { factor: group.factor, cap: group.cap };
      group.loadedRate = null;
      const prior = group.tariffs[value];
      group.factor = prior?.factor ?? '';
      group.cap = prior?.cap ?? '';
    }
    group[set] = value;
    if (state.tab === 'fee' && (set === 'type' || (set === 'mode' && value === 'official'))) applyTariff();
    if (state.tab === 'convert' && set === 'full') group.anchor = 'share';
    persist();
    updateView(`[data-set="${set}"][data-value="${value}"]`);
    return;
  }
  const action = button.dataset.action;
  switch (action) {
    case 'language':
    case 'theme': {
      if (action === 'language') state.lang = state.lang === 'en' ? 'fa' : 'en';
      else state.theme = state.theme === 'dark' ? 'light' : 'dark';
      persist();
      const open = Boolean($('rateDetails')?.open);
      frame();
      render(open);
      $('top').querySelector(`[data-action="${action}"]`).focus({ preventScroll: true });
      break;
    }
    case 'reset': {
      const active = state.tab;
      const rates = state.fee.localRates;
      state[active] = structuredClone(initial[active]);
      if (active === 'fee') state.fee.localRates = rates;
      persist();
      render();
      $('workspace').querySelector('[data-action=reset]').focus({ preventScroll:true });
      notify(t('فرم پاک شد. مبلغ‌های تازه را وارد کنید.','Form cleared. You can enter new amounts.'));
      break;
    }
    case 'reset-tehran':
      state.fee.tehran = {};
      persist();
      render();
      $('tehranDetails').open = true;
      $('workspace').querySelector('[data-action=reset-tehran]').focus({ preventScroll:true });
      break;
    case 'jump-result': {
      const heading = $('result-heading');
      heading.focus({ preventScroll:true });
      heading.scrollIntoView({ block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      break;
    }
    case 'sample':
      if (state.tab === 'renewal') Object.assign(state.renewal,{deposit:'500000000',rent:'15000000',newDeposit:'500000000',newRent:'21000000',increase:'20',rate:'30000'});
      if (state.tab === 'compare') Object.assign(state.compare,{months:'12',rate:'30000',offers:[{deposit:'500000000',rent:'15000000',fee:'5000000'},{deposit:'700000000',rent:'8000000',fee:'6000000'}]});
      persist();
      updateView('[data-action=sample]');
      break;
    case 'add-offer':
      if (state.compare.offers.length < 3) state.compare.offers.push({deposit:'',rent:'',fee:''});
      persist();
      updateView('#in-offer-2-deposit');
      break;
    case 'remove-offer':
      if (state.compare.offers.length > 2) state.compare.offers.pop();
      persist();
      updateView('[data-action=add-offer]');
      break;
    case 'save': {
      if (!report) break;
      const text = reportText();
      if (state.saved[0]?.text === text) { notify(t('این نتیجه قبلاً ذخیره شده است.','This result is already saved.')); break; }
      state.saved.unshift({id:uuid(),tab:state.tab,date:new Date().toISOString(),text});
      state.saved = state.saved.slice(0, 12);
      persist();
      notify(storageAvailable ? t('نتیجه در سوابق ذخیره شد.','Result saved to history.') : t('نتیجه تا زمان باز بودن این صفحه در سوابق می‌ماند.','Result is saved for this page session.'));
      break;
    }
    case 'export-png':
    case 'export-pdf':
      void exportResult(action.slice(7));
      break;
    case 'copy':
      if (report) void copy(reportText());
      break;
    case 'history':
      history();
      break;
    case 'close-history':
      $('history').close();
      break;
    default:
      if (action?.startsWith('copy-item:')) {
        const item = state.saved.find(entry => entry.id === action.slice(10));
        if (item) void copy(item.text);
      }
      if (action?.startsWith('remove-item:')) {
        state.saved = state.saved.filter(entry => entry.id !== action.slice(12));
        persist();
        history();
        $('history').querySelector('[data-action=close-history]').focus();
      }
  }
});
$('workspace').addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'countyForm') {
    selectCounty($('in-county').value);
    persist();
    updateView('#in-county');
    return;
  }
  if (event.target.id !== 'tariffForm') return;
  const s = state.fee;
  const error = $('tariffError');
  const county = $('in-county').value.trim();
  const source = httpsSource($('in-source').value.trim());
  const from = tariffDate(normalize($('in-from').value));
  const until = tariffDate(normalize($('in-until').value));
  const factor = percentage(s.factor);
  const cap = money(s.cap);
  if (!county || factor === null || factor < 0n || factor > PERCENT || cap === null) {
    error.textContent = t('برای ذخیره، نام شهرستان، درصد و سقف تعرفه را کامل کنید. سقف صفر فقط برای نرخنامه‌ای است که سقف آن واقعاً صفر است.', 'Enter the county, percentage, and fee cap. Enter zero only if the published cap is zero.');
    return;
  }
  if (!source || !from || !until || from > until) {
    error.textContent = t('لینک منبع و بازهٔ معتبر را وارد کنید. نمونهٔ تاریخ شمسی ۱۴۰۵/۰۱/۰۱ و نمونهٔ میلادی ۲۰۲۶-۰۳-۲۱ است.', 'Enter a source link starting with https:// and a valid date range, such as 2026-03-21.');
    return;
  }
  const key = countyKey(county);
  const type = tariffType(s.type);
  s.localRates = s.localRates.filter(item=>item.key !== key || item.type !== type || item.until < from || item.from > until);
  s.localRates.unshift({key,county,type,source,from,until,factor:s.factor,cap:s.cap});
  s.county = county;
  applyTariff();
  persist();
  updateView('#in-county');
  notify(storageAvailable ? t('تعرفه ذخیره شد. در بازهٔ اعتبار خودکار بارگذاری می‌شود.','Tariff saved. It loads automatically during its validity period.') : t('تعرفه تا زمان باز بودن صفحه در دسترس است.','Tariff is available for this page session.'));
});
function updateCountyInput(input) {
  if (countyKey(state.fee.county) === countyKey(input.value)) return;
  selectCounty(input.value);
  syncTariffFields();
  persist();
  calculate();
}
if (state.fee.loadedRate || (blank(state.fee.factor) && blank(state.fee.cap))) applyTariff();
frame();
render();

loadContent().then(settings => {
  if (!settings || Object.keys(content).length) return;
  content = settings;
  frame();
  render(Boolean($('rateDetails')?.open));
});

if (previewMode) {
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'melksanj-preview') return;
    content = event.data.content ?? {};
    if (['fa', 'en'].includes(event.data.lang)) state.lang = event.data.lang;
    if (['light', 'dark'].includes(event.data.theme)) state.theme = event.data.theme;
    if (Object.hasOwn(views, event.data.tab)) state.tab = event.data.tab;
    frame();
    render(Boolean($('rateDetails')?.open));
  });
}
