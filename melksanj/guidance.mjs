import { commission, growthPercent, PERCENT } from './math.mjs';

export const tehranReference = {
  source: 'https://www.tasnimnews.ir/fa/news/1405/04/02/3624201/%D8%AA%D9%85%D8%AF%DB%8C%D8%AF-%D8%AE%D9%88%D8%AF%DA%A9%D8%A7%D8%B1-%D9%82%D8%B1%D8%A7%D8%B1%D8%AF%D8%A7%D8%AF%D9%87%D8%A7%DB%8C-%D8%A7%D8%AC%D8%A7%D8%B1%D9%87-%D8%A8%D8%A7-%D8%B3%D9%82%D9%81-25-%D8%AF%D8%B1%D8%B5%D8%AF-%D8%A8%D9%87-%D8%AA%D8%B5%D9%88%DB%8C%D8%A8-%D8%B3%D8%B1%D8%A7%D9%86-%D9%82%D9%88%D8%A7-%D8%B1%D8%B3%DB%8C%D8%AF/amp',
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
