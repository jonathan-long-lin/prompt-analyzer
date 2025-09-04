'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {t.language}:
      </span>
      <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => setLanguage('ja')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'ja'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {t.japanese}
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {t.english}
        </button>
      </div>
    </div>
  );
}
