'use client';

import { useState } from 'react';

interface AnalysisResult {
  word_count: number;
  character_count: number;
  sentence_count: number;
  paragraph_count: number;
  readability_score: number;
  complexity_level: string;
  keywords: string[];
  sentiment: string;
  suggestions: string[];
}

export default function PromptAnalyzer() {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to analyze');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze prompt');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze prompt. Make sure the backend is running.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setPrompt('');
    setAnalysis(null);
    setError('');
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'Very Easy': return 'text-green-600 bg-green-100';
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'Difficult': return 'text-orange-600 bg-orange-100';
      case 'Very Difficult': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-100';
      case 'Negative': return 'text-red-600 bg-red-100';
      case 'Neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Enter Your Prompt
        </h2>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type or paste your prompt here..."
          className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={loading}
        />
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={analyzePrompt}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Prompt'}
          </button>
          
          <button
            onClick={clearAnalysis}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Basic Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Basic Metrics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analysis.word_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Words</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysis.character_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Characters</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.sentence_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Sentences</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {analysis.paragraph_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Paragraphs</div>
              </div>
            </div>
          </div>

          {/* Readability & Sentiment */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Readability
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Score:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {analysis.readability_score}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Level:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(analysis.complexity_level)}`}>
                    {analysis.complexity_level}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Sentiment Analysis
              </h3>
              
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-lg font-medium ${getSentimentColor(analysis.sentiment)}`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Key Terms
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Suggestions for Improvement
            </h3>
            
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
