import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { calculateTotalRahnValue, formatCurrency, rahnToRent, rentToRahn, RAHN_UNIT } from '../utils/currency';
import { Calculator } from 'lucide-react';
import { useApp } from '../utils/context';

const BasicConversion: React.FC = () => {
  const { t, lang } = useApp();

  // Initialize as empty string to show placeholder
  const [totalValue, setTotalValue] = useState<number | ''>(''); 
  const [mortgagePart, setMortgagePart] = useState<number | ''>('');
  const [rentPart, setRentPart] = useState<number>(0);

  // When Total Value or Mortgage Part changes, recalculate Rent
  useEffect(() => {
    const total = typeof totalValue === 'number' ? totalValue : 0;
    const mortgage = typeof mortgagePart === 'number' ? mortgagePart : 0;

    // If inputs are empty, result is 0
    if (total === 0) {
        setRentPart(0);
        return;
    }

    // Ensure mortgage part doesn't exceed total value
    if (mortgage > total) {
      setMortgagePart(total);
      setRentPart(0);
    } else {
      const remainingForRent = total - mortgage;
      setRentPart(rahnToRent(remainingForRent));
    }
  }, [totalValue, mortgagePart]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If total value is not set, slider shouldn't really do anything effective or should default to 0
    if (typeof totalValue !== 'number') return;
    
    const val = Number(e.target.value);
    setMortgagePart(val);
  };

  const handleRentChange = (val: number | '') => {
    if (typeof totalValue !== 'number') return;

    if (val === '') {
        // If rent is cleared, it implies full mortgage usually, or just wait for input
        // Let's set mortgage to total (0 rent)
        setMortgagePart(totalValue);
        return;
    }

    const rentVal = val;
    // Calculate how much Rahn is consumed by this rent
    const rahnUsed = rentToRahn(rentVal);
    
    // Mortgage is the remaining part
    let newMortgage = totalValue - rahnUsed;
    
    // Clamp values
    if (newMortgage < 0) newMortgage = 0;
    if (newMortgage > totalValue) newMortgage = totalValue;

    setMortgagePart(newMortgage);
  };

  // Helper values for rendering
  const safeTotalValue = typeof totalValue === 'number' ? totalValue : 0;
  const safeMortgagePart = typeof mortgagePart === 'number' ? mortgagePart : 0;
  
  const footerNote = t.basicFooterNote.replace('{amount}', formatCurrency(safeTotalValue - safeMortgagePart, lang));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
        <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800 dark:text-blue-300 text-lg mb-1">{t.basicTitle}</h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm leading-relaxed">
            {t.basicDesc}
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6">
        <CurrencyInput
          label={t.fullMortgageLabel}
          value={totalValue}
          onChange={(val) => {
            setTotalValue(val);
            // If we are setting a new total, ensuring mortgage part isn't higher
            if (typeof val === 'number' && typeof mortgagePart === 'number' && val < mortgagePart) {
                setMortgagePart(val);
            }
          }}
        />

        <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm space-y-8">
          
          {/* Slider Control */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t.adjustable}</span>
             </div>

            {/* Slider */}
            <div className="relative pt-2 pb-2">
                <input
                type="range"
                min={0}
                max={safeTotalValue}
                step={RAHN_UNIT} // 1 Million steps
                value={safeMortgagePart}
                onChange={handleSliderChange}
                disabled={typeof totalValue !== 'number'}
                className="w-full disabled:opacity-50"
                />
                {/* Markers */}
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
                <span>0</span>
                <span>{formatCurrency(safeTotalValue / 2, lang)}</span>
                <span>{formatCurrency(safeTotalValue, lang)}</span>
                </div>
            </div>
          </div>

          {/* Inputs Grid (Editable Results) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="relative group">
              <CurrencyInput 
                label={t.finalMortgage} 
                value={mortgagePart} 
                onChange={setMortgagePart}
                className="relative z-10"
              />
              {/* Optional Visual Indicator */}
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 rounded-xl -m-2 z-0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            </div>

            <div className="relative group">
               <CurrencyInput 
                label={t.monthlyRent} 
                value={rentPart} 
                onChange={handleRentChange}
                className="relative z-10"
               />
               <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl -m-2 z-0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
            
            <div className="md:col-span-2 text-center pt-2">
                 <p className="text-xs text-slate-400 dark:text-slate-500 leading-5 bg-slate-50 dark:bg-slate-900 inline-block px-3 py-1 rounded-full">
                    {footerNote}
                  </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicConversion;