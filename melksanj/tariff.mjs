export const regulationUrl = 'https://hoghogh.ai/circulars/c-5128c46d';

export function countyKey(name) {
  return String(name).normalize('NFKC').replace(/[\s\u200c]+/g, ' ').trim()
    .replace(/ي/g,'ی').replace(/ك/g,'ک').toLocaleLowerCase('fa');
}

export function tariffType(type) {
  return type === 'sale' ? 'ownership' : 'lease';
}

export function httpsSource(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function isoDate(value) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value ? value : null;
}

export function tehranDay() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Tehran', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts();
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return [values.year, values.month, values.day].join('-');
}

export function findTariff(records, county, type, date) {
  const key = countyKey(county);
  return records.find(record => record.key === key && record.type === tariffType(type) && record.from <= date && date <= record.until);
}

export function tariffDate(value) {
  const date = value.replaceAll('/', '-').replace(/-(\d)(?=-|$)/g, '-0$1');
  const gregorian = isoDate(date);
  if (gregorian) return gregorian;
  if (!/^(?:13|14)\d{2}-\d{2}-\d{2}$/.test(date)) return null;
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone:'UTC', year:'numeric', month:'2-digit', day:'2-digit'
  });
  const year = Number(date.slice(0,4)) + 621;
  const dayMs = 86_400_000;
  let start = Date.UTC(year,0,1) / dayMs;
  let end = Date.UTC(year + 1,4,1) / dayMs;
  while (start <= end) {
    const middle = Math.floor((start + end) / 2);
    const instant = new Date(middle * dayMs);
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type,part.value]));
    const candidate = [parts.year,parts.month,parts.day].join('-');
    if (candidate === date) return instant.toISOString().slice(0,10);
    if (candidate < date) start = middle + 1;
    else end = middle - 1;
  }
  return null;
}
