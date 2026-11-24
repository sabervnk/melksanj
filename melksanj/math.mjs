export const MILLION = 1_000_000n;
export const PERCENT = 1_000_000n;
export const LIMIT = 999_999_999_999_999n;

export function normalize(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, char => String(char.charCodeAt(0) & 15))
    .replace(/[٬,\s]/g, '').replace('٫', '.').replace(/^[−–]/, '-');
}

export function money(raw) {
  const value = normalize(raw);
  if (!/^\d{1,15}$/.test(value)) return null;
  return BigInt(value);
}

export function percentage(raw) {
  const value = normalize(raw);
  if (!/^-?(?:\d{1,5}(?:\.\d{0,4})?|\.\d{1,4})$/.test(value)) return null;
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const scaled = BigInt(whole || 0) * 10_000n + BigInt(fraction.padEnd(4, '0'));
  return value.startsWith('-') ? -scaled : scaled;
}

export function divide(numerator, denominator) {
  if (denominator <= 0n) throw new RangeError('Positive divisor required');
  return (numerator < 0n ? -1n : 1n) * ((2n * (numerator < 0n ? -numerator : numerator) + denominator) / (2n * denominator));
}

export function monthlyFromFull(full, rate) {
  return divide(full * rate, MILLION);
}

export function fullFromMonthly(monthly, rate) {
  return divide(monthly * MILLION, rate);
}

export function equivalent(deposit, rent, rate) {
  return deposit + fullFromMonthly(rent, rate);
}

export function growthPercent(difference, base) {
  return base === 0n ? null : divide(difference * PERCENT, base);
}

export function renew(deposit, rent, rate, increase, mode) {
  const base = deposit * rate + rent * MILLION;
  if (mode === 'both') {
    const apply = value => divide(value * (PERCENT + increase), PERCENT);
    return { deposit: apply(deposit), rent: apply(rent), impossible: false };
  }
  const change = base * increase;
  const divisor = (mode === 'deposit' ? rate : MILLION) * PERCENT;
  const fixed = mode === 'deposit' ? deposit : rent;
  if (fixed * divisor + change < 0n) return { impossible: true };
  const revised = fixed + divide(change, divisor);
  return mode === 'deposit' ? { deposit: revised, rent, impossible: false } : { deposit, rent: revised, impossible: false };
}

export function commission(numerator, denominator, factor, vat, eachSide, cap = null) {
  const base = divide(numerator * factor * (eachSide ? 2n : 1n), denominator * PERCENT);
  const subtotal = cap !== null && cap < base ? cap : base;
  const tax = divide(subtotal * vat, PERCENT);
  const total = subtotal + tax;
  return { base, subtotal, tax, total, first: (total + 1n) / 2n, second: total / 2n };
}

export function scenario(deposit, rent, fee, months, rate) {
  const cash = rent * months + fee;
  const comparable = divide((deposit * rate + rent * MILLION) * months, MILLION) + fee;
  return { cash, comparable };
}
