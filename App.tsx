import React, { useState } from 'react';
import BasicConversion from './components/BasicConversion';
import RenewalCalculator from './components/RenewalCalculator';
import { Home, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'renewal'>('basic');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                    <Home size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">محاسبه‌گر املاک</h1>
                    <p className="text-xs text-slate-500">رهن، اجاره و تبدیل نرخ</p>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Tabs */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex mb-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200
              ${activeTab === 'basic' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Home size={18} />
            تبدیل ساده
          </button>
          <button
            onClick={() => setActiveTab('renewal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200
              ${activeTab === 'renewal' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <RefreshCw size={18} />
            تمدید و افزایش
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          {/* We keep both components mounted but toggle visibility to persist state */}
          <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
            <BasicConversion />
          </div>
          <div className={activeTab === 'renewal' ? 'block' : 'hidden'}>
            <RenewalCalculator />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-400">
                مبنای محاسبه: هر ۱ میلیون تومان رهن معادل ۳۰ هزار تومان اجاره (۳٪).
            </p>
            <p className="text-xs text-slate-300 mt-2">
                این محاسبات تقریبی بوده و ممکن است بسته به عرف منطقه و توافق طرفین تغییر کند.
            </p>
        </div>
      </main>
    </div>
  );
};

export default App;