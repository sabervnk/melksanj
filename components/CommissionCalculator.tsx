import React, { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { formatCurrency, rahnToRent } from '../utils/currency';
import { Handshake, ReceiptText, Percent } from 'lucide-react';
import { useApp } from '../utils/context';

type TransType = 'sale' | 'rent' | 'fullRahn';

const CommissionCalculator: React.FC = () => {
  const { t, lang } = useApp();
  const [type, setType] = useState<TransType>('sale');
  
  // Inputs
  const [price, setPrice] = useState<number | ''>('');
  const [rahn, setRahn] = useState<number | ''>('');
  const [rent, setRent] = useState<number | ''>('');
  const [customPct, setCustomPct] = useState<number | ''>('');

  // Results
  const [baseComm, setBaseComm] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let base = 0;
    const TAX_RATE = 0.09;
    const isManual = typeof customPct === 'number' && customPct > 0;
    const manualFactor = isManual ? (customPct as number) / 100 : 0;

    if (type === 'sale') {
      const val = typeof price === 'number' ? price : 0;
      base = isManual ? val * manualFactor : val * 0.0025; // Default: 0.25%
    } else if (type === 'rent') {
      const rVal = typeof rahn === 'number' ? rahn : 0;
      const rentVal = typeof rent === 'number' ? rent : 0;
      const convertedRahn = rahnToRent(rVal);
      const totalMonthlyRent = convertedRahn + rentVal;
      // In Iranian custom, manual rent commission is still often a % of monthly rent
      // Unless it's a huge deal where they might use total value, but we'll stick to factor replacement
      base = isManual ? totalMonthlyRent * manualFactor : totalMonthlyRent * 0.25; // Default: 25% of one month
    } else if (type === 'fullRahn') {
      const rVal = typeof rahn === 'number' ? rahn : 0;
      base = isManual ? rVal * manualFactor : rVal * 0.005; // Default: 0.5%
    }

    const calculatedTax = base * TAX_RATE;
    setBaseComm(base);
    setTax(calculatedTax);
    setTotal(base + calculatedTax);
  }, [type, price, rahn, rent, customPct]);

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
        <Handshake className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-lg mb-1">{t.commissionTitle}</h3>
          <p className="text-indigo-600 dark:text-indigo-400 text-sm leading-relaxed">
            {t.commissionDesc}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        {/* Type Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.transactionType}</label>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {(['sale', 'rent', 'fullRahn'] as TransType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setType(tab);
                  setCustomPct(''); // Reset custom pct when switching types to avoid confusion
                }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  type === tab
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'sale' ? t.typeSale : tab === 'rent' ? t.typeRent : t.typeFullRahn}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Inputs */}
        <div className="grid gap-4">
          {type === 'sale' && (
            <CurrencyInput label={t.salePrice} value={price} onChange={setPrice} />
          )}
          {(type === 'rent' || type === 'fullRahn') && (
            <CurrencyInput label={t.finalMortgage} value={rahn} onChange={setRahn} />
          )}
          {type === 'rent' && (
            <CurrencyInput label={t.monthlyRent} value={rent} onChange={setRent} />
          )}
        </div>

        {/* Custom Percent Input */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
           <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                   <Percent className="w-4 h-4 text-indigo-500" />
                   {t.customPercent}
                </label>
                {customPct !== '' && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    {t.customPercentDesc}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  placeholder={type === 'sale' ? '0.25' : type === 'rent' ? '25' : '0.5'}
                  value={customPct}
                  onChange={(e) => setCustomPct(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-3 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-center focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
           </div>
        </div>

        {/* Results Card */}
        <div className="mt-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 space-y-4 relative overflow-hidden">
           {/* Visual background indicator if custom */}
           {customPct !== '' && (
             <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
             </div>
           )}

           <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm">
              <span>{t.commissionBase}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(Math.round(baseComm), lang)} {t.currency}
              </span>
           </div>
           <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-sm">
              <span>{t.commissionTax}</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(Math.round(tax), lang)} {t.currency}
              </span>
           </div>
           <div className="pt-4 border-t border-indigo-200 dark:border-indigo-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-indigo-900 dark:text-indigo-100">{t.commissionTotal}</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  {formatCurrency(Math.round(total), lang)}
                </div>
                <div className="text-[10px] text-indigo-400 uppercase font-bold">{t.currency}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionCalculator;