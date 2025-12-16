import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { calculateTotalRahnValue, formatCurrency } from '../utils/currency';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { useApp } from '../utils/context';

const RenewalCalculator: React.FC = () => {
  const { t, lang } = useApp();

  // Current Contract State (Empty initially)
  const [curMortgage, setCurMortgage] = useState<number | ''>('');
  const [curRent, setCurRent] = useState<number | ''>('');

  // New Contract State
  const [newMortgage, setNewMortgage] = useState<number | ''>('');
  const [newRent, setNewRent] = useState<number | ''>('');
  const [increasePercent, setIncreasePercent] = useState<number | ''>('');

  // Helper: Round to nearest 1000
  const roundVal = (val: number) => Math.round(val / 1000) * 1000;

  // When Percent changes -> Update New Mortgage & Rent
  // BUT only if percent is NOT empty
  const handlePercentChange = (valStr: string) => {
    if (valStr === '') {
        setIncreasePercent('');
        setNewMortgage('');
        setNewRent('');
        return;
    }

    const val = Number(valStr);
    setIncreasePercent(val);

    const cM = typeof curMortgage === 'number' ? curMortgage : 0;
    const cR = typeof curRent === 'number' ? curRent : 0;

    const factor = 1 + val / 100;
    setNewMortgage(roundVal(cM * factor));
    setNewRent(roundVal(cR * factor));
  };

  // If Current values change, and we have a percent, update new values
  useEffect(() => {
    if (increasePercent !== '') {
        const cM = typeof curMortgage === 'number' ? curMortgage : 0;
        const cR = typeof curRent === 'number' ? curRent : 0;
        const factor = 1 + (increasePercent as number) / 100;
        setNewMortgage(roundVal(cM * factor));
        setNewRent(roundVal(cR * factor));
    }
  }, [curMortgage, curRent]); // Removed increasePercent from dep to avoid loop, handled in change handler

  // When New Mortgage changes -> Update Percent
  const handleNewMortgageChange = (val: number | '') => {
    setNewMortgage(val);
    if (val === '') return;
    updatePercentFromValues(val, typeof newRent === 'number' ? newRent : 0);
  };

  // When New Rent changes -> Update Percent
  const handleNewRentChange = (val: number | '') => {
    setNewRent(val);
    if (val === '') return;
    updatePercentFromValues(typeof newMortgage === 'number' ? newMortgage : 0, val);
  };

  // Logic to calculate percent based on Total Value comparison
  const updatePercentFromValues = (nM: number, nR: number) => {
    const cM = typeof curMortgage === 'number' ? curMortgage : 0;
    const cR = typeof curRent === 'number' ? curRent : 0;
    
    const curTotal = calculateTotalRahnValue(cM, cR);
    const newTotal = calculateTotalRahnValue(nM, nR);
    
    if (curTotal === 0) return;

    const diff = newTotal - curTotal;
    const percent = (diff / curTotal) * 100;
    
    setIncreasePercent(parseFloat(percent.toFixed(1)));
  };

  // Derived Total Values for display
  const curTotalValue = calculateTotalRahnValue(
    typeof curMortgage === 'number' ? curMortgage : 0, 
    typeof curRent === 'number' ? curRent : 0
  );
  
  const newTotalValue = calculateTotalRahnValue(
    typeof newMortgage === 'number' ? newMortgage : 0, 
    typeof newRent === 'number' ? newRent : 0
  );

  // Helper for Diff display
  const getDiff = (newVal: number | '', oldVal: number | '') => {
     const n = typeof newVal === 'number' ? newVal : 0;
     const o = typeof oldVal === 'number' ? oldVal : 0;
     return n - o;
  };

  const diffMortgage = getDiff(newMortgage, curMortgage);
  const diffRent = getDiff(newRent, curRent);

  // Show results only if percent is entered (not empty string)
  const showResults = increasePercent !== '';

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-start gap-3">
        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg mb-1">{t.renewalTitle}</h3>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm leading-relaxed">
            {t.renewalDesc}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Current Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2 mb-4">{t.currentStatus}</h4>
          <CurrencyInput
            label={t.currentMortgage}
            value={curMortgage}
            onChange={setCurMortgage}
          />
          <CurrencyInput
            label={t.currentRent}
            value={curRent}
            onChange={setCurRent}
          />
          
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
             <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t.totalValueLabel}</div>
             <div className="text-xl font-mono font-bold text-slate-700 dark:text-slate-200">{formatCurrency(Math.round(curTotalValue), lang)} <span className="text-sm font-sans font-normal">{t.currency}</span></div>
          </div>
        </div>

        {/* Right Column: New Contract */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm space-y-6 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 dark:bg-blue-600"></div>
          
          <div className="flex justify-between items-center border-b border-blue-200 dark:border-blue-800 pb-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-100">{t.newContract}</h4>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-blue-200 dark:border-slate-700 shadow-sm">
                <span className="text-xs text-blue-800 dark:text-blue-200">{t.increasePercent}</span>
                <input 
                    type="number" 
                    placeholder="-"
                    value={increasePercent}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    className="w-16 text-center font-bold text-blue-600 dark:text-blue-400 outline-none border-b border-dashed border-blue-300 dark:border-blue-700 focus:border-blue-500 bg-transparent placeholder-slate-300"
                    dir="ltr"
                />
                <span className="text-xs text-blue-800 dark:text-blue-200">%</span>
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${showResults ? 'opacity-100' : 'opacity-30 grayscale blur-[1px]'}`}>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-center mb-6">
                <div className="text-xs text-blue-800 dark:text-blue-200 mb-1">{t.newTotalValue}</div>
                <div className="text-xl font-mono font-bold text-blue-900 dark:text-blue-100">
                    {showResults ? formatCurrency(Math.round(newTotalValue), lang) : '---'} 
                    <span className="text-sm font-sans font-normal"> {t.currency}</span>
                </div>
            </div>

            <div className="space-y-6 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block opacity-20">
                    <ArrowLeftRight className="w-12 h-12 text-blue-900 dark:text-blue-200" />
                </div>

                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm ring-1 ring-blue-100 dark:ring-blue-900">
                    <CurrencyInput
                        label={t.newMortgage}
                        value={newMortgage}
                        onChange={handleNewMortgageChange}
                        disabled={!showResults}
                    />
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm ring-1 ring-blue-100 dark:ring-blue-900">
                    <CurrencyInput
                        label={t.newRent}
                        value={newRent}
                        onChange={handleNewRentChange}
                        disabled={!showResults}
                    />
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Diff Info */}
      {showResults && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 animate-fade-in">
         <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 text-center">
            <div className="text-xs text-slate-400 dark:text-slate-500">{t.diffMortgage}</div>
            <div className={`font-mono font-bold text-lg ${diffMortgage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                {diffMortgage > 0 ? '+' : ''}{formatCurrency(diffMortgage, lang)}
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 text-center">
            <div className="text-xs text-slate-400 dark:text-slate-500">{t.diffRent}</div>
             <div className={`font-mono font-bold text-lg ${diffRent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                {diffRent > 0 ? '+' : ''}{formatCurrency(diffRent, lang)}
            </div>
         </div>
      </div>
      )}
    </div>
  );
};

export default RenewalCalculator;