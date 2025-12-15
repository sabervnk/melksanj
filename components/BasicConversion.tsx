import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { calculateTotalRahnValue, formatCurrency, rahnToRent, RAHN_UNIT } from '../utils/currency';
import { Calculator } from 'lucide-react';

const BasicConversion: React.FC = () => {
  // State: We keep track of the "Full Rahn Value" (Total Value) and the "Selected Rahn"
  const [totalValue, setTotalValue] = useState<number>(1000000000); // Default 1 Billion
  const [mortgagePart, setMortgagePart] = useState<number>(500000000); // Default 500 Million
  const [rentPart, setRentPart] = useState<number>(0);

  // When Total Value or Mortgage Part changes, recalculate Rent
  useEffect(() => {
    // Ensure mortgage part doesn't exceed total value
    if (mortgagePart > totalValue) {
      setMortgagePart(totalValue);
      setRentPart(0);
    } else {
      const remainingForRent = totalValue - mortgagePart;
      setRentPart(rahnToRent(remainingForRent));
    }
  }, [totalValue, mortgagePart]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Slider returns percentage (0-100) or direct step value
    // Let's use steps of 1 Million for smoother UX on slider
    const val = Number(e.target.value);
    setMortgagePart(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
        <Calculator className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800 text-lg mb-1">تبدیل رهن کامل به ترکیبی</h3>
          <p className="text-blue-600 text-sm leading-relaxed">
            مبلغ «رهن کامل» ملک را وارد کنید. سپس با تغییر نوار لغزنده، نسبت رهن و اجاره را تعیین کنید.
            مبنای محاسبه: هر ۱ میلیون تومان رهن = ۳۰ هزار تومان اجاره.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6">
        <CurrencyInput
          label="ارزش رهن کامل ملک (تومان)"
          value={totalValue}
          onChange={(val) => {
            setTotalValue(val);
            // Reset split to roughly 50% or keep ratio if needed, but keeping current amount valid is safer
            if (val < mortgagePart) setMortgagePart(val);
          }}
        />

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-8">
          
          {/* Controls: Slider & Manual Input */}
          <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">تعیین مبلغ رهن</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">قابل تنظیم</span>
                </div>
                <div className="w-full md:w-1/2">
                    <CurrencyInput 
                        label="" 
                        placeholder="مبلغ رهن را وارد کنید"
                        value={mortgagePart} 
                        onChange={setMortgagePart} 
                        className=""
                    />
                </div>
             </div>

            {/* Slider */}
            <div className="relative pt-4 pb-2">
                <input
                type="range"
                min={0}
                max={totalValue}
                step={RAHN_UNIT} // 1 Million steps
                value={mortgagePart}
                onChange={handleSliderChange}
                className="w-full"
                />
                {/* Markers */}
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                <span>0</span>
                <span>{formatCurrency(totalValue / 2)}</span>
                <span>{formatCurrency(totalValue)}</span>
                </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-sm text-slate-500">مبلغ رهن نهایی</label>
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <span className="font-mono font-bold text-2xl text-blue-700">
                  {formatCurrency(mortgagePart)}
                </span>
                <span className="text-sm text-blue-400 font-medium">تومان</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-500">اجاره ماهیانه</label>
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <span className="font-mono font-bold text-2xl text-emerald-700">
                  {formatCurrency(rentPart)}
                </span>
                <span className="text-sm text-emerald-400 font-medium">تومان</span>
              </div>
            </div>
            
            <div className="md:col-span-2 text-center pt-2">
                 <p className="text-xs text-slate-400 leading-5 bg-slate-50 inline-block px-3 py-1 rounded-full">
                    این مبلغ اجاره معادل سود {formatCurrency(totalValue - mortgagePart)} تومان از پول رهن است.
                  </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicConversion;