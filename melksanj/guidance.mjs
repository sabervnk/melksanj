import { commission, growthPercent, PERCENT } from './math.mjs';

export const tehranReference = {
  source: 'https://online.flipbuilder.com/wocsy/nsxj/files/basic-html/page32.html',
  sale: '0.25', deposit: '0.5', rent: '25', vat: '10', cap: null
};

export const renewalReference = {
  source: 'https://hoghogh.ai/circulars/c-b52ac9a7', threshold: 250000n,
  start: '2026-06-29', end: '2027-03-20'
};

export function tehranFee(type, amounts, rates, vat, cap) {
  const numerator = type === 'sale' ? amounts.price * rates.sale : amounts.deposit * rates.deposit + (type === 'lease' ? amounts.rent * rates.rent : 0n);
  return commission(numerator, 1n, 1n, vat, true, cap);
}

export function exceedsRenewalReference(before, after) {
  return before > 0n && (after - before) * PERCENT > before * renewalReference.threshold;
}

export function renewalChanges(beforeDeposit, beforeRent, afterDeposit, afterRent, beforeValue, afterValue) {
  return [
    [exceedsRenewalReference(beforeDeposit, afterDeposit), growthPercent(afterDeposit - beforeDeposit, beforeDeposit)],
    [exceedsRenewalReference(beforeRent, afterRent), growthPercent(afterRent - beforeRent, beforeRent)],
    [exceedsRenewalReference(beforeValue, afterValue), growthPercent(afterValue - beforeValue, beforeValue)]
  ];
}
