'use client';

import { useState } from 'react';
import PromptAnalyzer from '@/components/PromptAnalyzer';
import Analytics from '@/components/Analytics';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState('analytics');
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t.subtitle}
              </p>
            </div>
            <LanguageSelector />
          </div>
        </header>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.analyticsTab}
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'analyzer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.promptAnalyzerTab}
            </button>
          </div>
        </div>
        
        <main>
          {activeTab === 'analytics' ? <Analytics /> : <PromptAnalyzer />}
        </main>
      </div>
    </div>
  );
}
