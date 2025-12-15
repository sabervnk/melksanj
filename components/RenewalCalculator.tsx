import React, { useState, useEffect, useCallback } from 'react';
import CurrencyInput from './CurrencyInput';
import { calculateTotalRahnValue, formatCurrency, rahnToRent, rentToRahn } from '../utils/currency';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';

const RenewalCalculator: React.FC = () => {
  // Current Contract State
  const [curMortgage, setCurMortgage] = useState<number>(200000000);
  const [curRent, setCurRent] = useState<number>(3000000);

  // New Contract State
  const [newMortgage, setNewMortgage] = useState<number>(0);
  const [newRent, setNewRent] = useState<number>(0);
  const [increasePercent, setIncreasePercent] = useState<number>(20);

  // Helper: Round to nearest 1000 to avoid decimals and weird numbers
  const roundVal = (val: number) => Math.round(val / 1000) * 1000;

  // Initialize new values based on default percent
  useEffect(() => {
    // Only run this once on mount to set initial values
    if (newMortgage === 0 && newRent === 0) {
        const factor = 1 + increasePercent / 100;
        setNewMortgage(roundVal(curMortgage * factor));
        setNewRent(roundVal(curRent * factor));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When Percent changes -> Update New Mortgage & Rent (Proportional Scale)
  const handlePercentChange = (val: number) => {
    setIncreasePercent(val);
    const factor = 1 + val / 100;
    setNewMortgage(roundVal(curMortgage * factor));
    setNewRent(roundVal(curRent * factor));
  };

  // When New Mortgage changes -> Update Percent
  const handleNewMortgageChange = (val: number) => {
    setNewMortgage(val);
    updatePercentFromValues(val, newRent);
  };

  // When New Rent changes -> Update Percent
  const handleNewRentChange = (val: number) => {
    setNewRent(val);
    updatePercentFromValues(newMortgage, val);
  };

  // Logic to calculate percent based on Total Value comparison
  const updatePercentFromValues = (nM: number, nR: number) => {
    const curTotal = calculateTotalRahnValue(curMortgage, curRent);
    const newTotal = calculateTotalRahnValue(nM, nR);
    
    if (curTotal === 0) return;

    const diff = newTotal - curTotal;
    const percent = (diff / curTotal) * 100;
    
    // Update percent state without triggering the reverse effect (since we control flow via handlers)
    // We round percent to 1 decimal place for cleaner look, or integer if user prefers
    setIncreasePercent(parseFloat(percent.toFixed(1)));
  };

  // Derived Total Values for display
  const curTotalValue = calculateTotalRahnValue(curMortgage, curRent);
  const newTotalValue = calculateTotalRahnValue(newMortgage, newRent);

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
        <TrendingUp className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-emerald-800 text-lg mb-1">محاسبه افزایش و تمدید</h3>
          <p className="text-emerald-600 text-sm leading-relaxed">
            با تغییر درصد افزایش، مبالغ جدید به نسبت وضعیت فعلی رشد می‌کنند. همچنین می‌توانید مبالغ جدید را دستی تغییر دهید تا درصد افزایش محاسبه شود.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Current Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 border-b pb-2 mb-4">وضعیت فعلی (سال گذشته)</h4>
          <CurrencyInput
            label="مبلغ رهن فعلی"
            value={curMortgage}
            onChange={(v) => {
                setCurMortgage(v);
                // Optionally update new values immediately to maintain percent? 
                // Let's just let the user adjust.
            }}
          />
          <CurrencyInput
            label="مبلغ اجاره فعلی"
            value={curRent}
            onChange={setCurRent}
          />
          
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
             <div className="text-sm text-slate-500 mb-1">ارزش کل رهن (تبدیل شده):</div>
             <div className="text-xl font-mono font-bold text-slate-700">{formatCurrency(Math.round(curTotalValue))} <span className="text-sm font-sans font-normal">تومان</span></div>
          </div>
        </div>

        {/* Right Column: New Contract */}
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
          
          <div className="flex justify-between items-center border-b border-blue-200 pb-2">
            <h4 className="font-bold text-blue-900">قرارداد جدید</h4>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-sm">
                <span className="text-xs text-blue-800">درصد افزایش:</span>
                <input 
                    type="number" 
                    value={increasePercent}
                    onChange={(e) => handlePercentChange(Number(e.target.value))}
                    className="w-16 text-center font-bold text-blue-600 outline-none border-b border-dashed border-blue-300 focus:border-blue-500 bg-transparent"
                    dir="ltr"
                />
                <span className="text-xs text-blue-800">%</span>
            </div>
          </div>

          <div className="p-3 bg-blue-100 rounded-lg text-center">
             <div className="text-xs text-blue-800 mb-1">ارزش کل جدید:</div>
             <div className="text-xl font-mono font-bold text-blue-900">{formatCurrency(Math.round(newTotalValue))} <span className="text-sm font-sans font-normal">تومان</span></div>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block opacity-20">
                <ArrowLeftRight className="w-12 h-12 text-blue-900" />
            </div>

            <div className="bg-white p-2 rounded-lg shadow-sm ring-1 ring-blue-100">
                <CurrencyInput
                    label="رهن جدید"
                    value={newMortgage}
                    onChange={handleNewMortgageChange}
                />
            </div>
            
            <div className="bg-white p-2 rounded-lg shadow-sm ring-1 ring-blue-100">
                <CurrencyInput
                    label="اجاره جدید"
                    value={newRent}
                    onChange={handleNewRentChange}
                />
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Diff Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
         <div className="bg-white p-3 rounded-xl border text-center">
            <div className="text-xs text-slate-400">تفاوت رهن</div>
            <div className={`font-mono font-bold text-lg ${newMortgage - curMortgage >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                {newMortgage - curMortgage > 0 ? '+' : ''}{formatCurrency(newMortgage - curMortgage)}
            </div>
         </div>
         <div className="bg-white p-3 rounded-xl border text-center">
            <div className="text-xs text-slate-400">تفاوت اجاره</div>
             <div className={`font-mono font-bold text-lg ${newRent - curRent >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                {newRent - curRent > 0 ? '+' : ''}{formatCurrency(newRent - curRent)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default RenewalCalculator;