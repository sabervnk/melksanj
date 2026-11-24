import { normalize } from './math.mjs';

export const separator = /[٬,\s]/;
export function groupedInput(raw, kind, persian) {
  const normalized = normalize(raw);
  const pattern = kind === 'decimal' ? /^-?\d*(?:\.\d*)?$/ : /^\d*$/;
  const grouped = pattern.test(normalized)
    ? normalized.replace(/^-?\d+/, whole => whole.replace(/\B(?=(\d{3})+(?!\d))/g, persian ? '٬' : ','))
    : normalized;
  return persian ? grouped.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('.', '٫') : grouped;
}

export function caretAt(value, offset) {
  if (offset === 0) return 0;
  for (let i = 0; i < value.length; i++) {
    if (!separator.test(value[i]) && --offset === 0) return i + 1;
  }
  return value.length;
}
