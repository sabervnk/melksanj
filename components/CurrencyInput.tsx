import React from 'react';
import { formatCurrency, parseCurrency } from '../utils/currency';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "0",
  className = "",
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numValue = parseCurrency(rawValue);
    onChange(numValue);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={value === 0 ? '' : formatCurrency(value)}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full p-3 pl-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-left font-mono text-lg
            ${disabled ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          تومان
        </span>
      </div>
    </div>
  );
};

export default CurrencyInput;