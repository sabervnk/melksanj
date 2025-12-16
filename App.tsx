import React, { useState } from 'react';
import BasicConversion from './components/BasicConversion';
import RenewalCalculator from './components/RenewalCalculator';
import { Home, RefreshCw, Moon, Sun, Languages } from 'lucide-react';
import { AppProvider, useApp } from './utils/context';

// Content component that uses the context
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'renewal'>('basic');
  const { lang, setLang, toggleTheme, theme, t } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pb-12 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 transition-colors duration-300 border-b dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-blue-200 dark:shadow-none shadow-lg">
                    <Home size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t.appTitle}</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.appSubtitle}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <div className="relative group">
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                        <Languages size={20} />
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden hidden group-hover:block z-50">
                        <button 
                            onClick={() => setLang('fa')}
                            className={`w-full text-right px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 ${lang === 'fa' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            فارسی
                        </button>
                        <button 
                             onClick={() => setLang('en')}
                             className={`w-full text-right px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 ${lang === 'en' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex mb-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200
              ${activeTab === 'basic' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Home size={18} />
            {t.tabBasic}
          </button>
          <button
            onClick={() => setActiveTab('renewal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all duration-200
              ${activeTab === 'renewal' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <RefreshCw size={18} />
            {t.tabRenewal}
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300">
          <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
            <BasicConversion />
          </div>
          <div className={activeTab === 'renewal' ? 'block' : 'hidden'}>
            <RenewalCalculator />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center border-t border-slate-200 dark:border-slate-700 pt-6">
            <p className="text-sm text-slate-400 dark:text-slate-500">
                {t.footerBase}
            </p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">
                {t.footerDisclaimer}
            </p>
            <p className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-6 font-medium opacity-80" dir="ltr">
                {t.footerLove}
            </p>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;