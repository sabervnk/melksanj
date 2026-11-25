import { MILLION, PERCENT, divide } from './math.mjs';

export function depositFromYield(value, annualYield, rate) {
  return divide(value * annualYield * MILLION, 12n * PERCENT * rate);
}

export function depositFromComparable(value, price, deposit, rent, rate, adjustment) {
  const comparableRent = deposit * rate + rent * MILLION;
  return divide(value * comparableRent * (PERCENT + adjustment), price * rate * PERCENT);
}

export function marketRange(values) {
  const sorted = [...values].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const midpoint = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[midpoint] : divide(sorted[midpoint - 1] + sorted[midpoint], 2n);
  return { median, low:sorted[0], high:sorted.at(-1) };
}
