import React from 'react';
import { formatCurrency, parseCurrency } from '../utils/currency';
import { useApp } from '../utils/context';

interface CurrencyInputProps {
  label: string;
  value: number | ''; // Allow empty string for "unfilled" state
  onChange: (value: number | '') => void; // Update type
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  className = "",
  disabled = false
}) => {
  const { lang, t } = useApp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Check if input is empty
    if (!rawValue) {
      onChange('');
      return;
    }

    const numValue = parseCurrency(rawValue);
    onChange(numValue);
  };

  const displayValue = value === '' || value === 0 ? '' : formatCurrency(value, lang);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder || t.placeholderAmount}
          className={`w-full p-3 pl-12 border rounded-lg outline-none transition-all text-left font-mono text-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400
            ${disabled 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' 
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white'
            }
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            `}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
          {t.currency}
        </span>
      </div>
    </div>
  );
};

export default CurrencyInput;