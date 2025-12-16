// Formats a number to string with commas (e.g., 1000000 -> 1,000,000)
export const formatCurrency = (value: number, lang: 'fa' | 'en' = 'fa'): string => {
  if (isNaN(value)) return '0';
  const locale = lang === 'fa' ? 'fa-IR' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
};

// Parses a string with commas back to a number (e.g., "1,000,000" -> 1000000)
// Handles English, Persian, and Arabic digits.
export const parseCurrency = (value: string): number => {
  if (!value) return 0;

  // Convert Persian and Arabic digits to English digits
  const englishValue = value
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');

  // Remove non-numeric characters (commas, spaces, etc)
  const cleanValue = englishValue.replace(/[^0-9]/g, '');
  
  const num = parseInt(cleanValue, 10);
  return isNaN(num) ? 0 : num;
};

// Conversion Constants
// 1 Million Rahn = 30,000 Rent
export const RAHN_TO_RENT_RATE = 30000; 
export const RAHN_UNIT = 1000000;

// Converts Rahn to equivalent Rent
export const rahnToRent = (rahn: number): number => {
  return (rahn / RAHN_UNIT) * RAHN_TO_RENT_RATE;
};

// Converts Rent to equivalent Rahn
export const rentToRahn = (rent: number): number => {
  return (rent / RAHN_TO_RENT_RATE) * RAHN_UNIT;
};

// Calculates total value of a deal in terms of "Full Rahn"
export const calculateTotalRahnValue = (rahn: number, rent: number): number => {
  return rahn + rentToRahn(rent);
};