'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewStats {
  total_prompts: number;
  unique_users: number;
  date_range: {
    start: string;
    end: string;
  };
  total_tokens: number;
  avg_quality: number;
  total_cost: number;
}

interface UserAnalytics {
  users: Array<{
    user_id: string;
    user_name: string;
    prompt_count: number;
    total_tokens: number;
    avg_tokens: number;
    avg_quality: number;
    avg_prompt_length: number;
    first_prompt: string;
    last_prompt: string;
    total_cost: number;
  }>;
  total_users: number;
}

interface TemporalData {
  period_type: string;
  data: Array<{
    period: string;
    period_value: string;
    prompt_count: number;
    total_tokens: number;
    avg_quality: number;
    unique_users?: number;
  }>;
}

interface ModelAnalytics {
  models: Array<{
    model: string;
    prompt_count: number;
    total_tokens: number;
    avg_tokens: number;
    avg_quality: number;
    avg_response_time: number;
    total_cost: number;
    usage_percentage: number;
  }>;
}

interface CategoryAnalytics {
  categories: Array<{
    category: string;
    prompt_count: number;
    avg_tokens: number;
    avg_quality: number;
    avg_prompt_length: number;
    usage_percentage: number;
  }>;
}

export default function Analytics() {
  const { t, getText } = useLanguage();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalData | null>(null);
  const [modelAnalytics, setModelAnalytics] = useState<ModelAnalytics | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics | null>(null);
  const [temporalPeriod, setTemporalPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sorting state for users table
  const [sortField, setSortField] = useState<keyof UserAnalytics['users'][0]>('prompt_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Sort state for temporal data table
  const [temporalSortField, setTemporalSortField] = useState<'period' | 'prompt_count' | 'total_tokens' | 'avg_quality' | 'unique_users'>('period');
  const [temporalSortDirection, setTemporalSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Sort state for model analytics table
  const [modelSortField, setModelSortField] = useState<'model' | 'prompt_count' | 'avg_quality' | 'avg_tokens' | 'total_cost' | 'avg_response_time' | 'usage_percentage'>('prompt_count');
  const [modelSortDirection, setModelSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Sort state for category analytics table
  const [categorySortField, setCategorySortField] = useState<'category' | 'prompt_count' | 'avg_quality' | 'usage_percentage'>('prompt_count');
  const [categorySortDirection, setCategorySortDirection] = useState<'asc' | 'desc'>('desc');

  // Temporal chart state
  const [temporalViewMode, setTemporalViewMode] = useState<'table' | 'chart'>('chart');
  const [chartMetric, setChartMetric] = useState<'prompt_count' | 'total_tokens' | 'avg_quality' | 'unique_users'>('prompt_count');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewRes, usersRes, temporalRes, modelsRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:8001/analytics/overview'),
        fetch('http://localhost:8001/analytics/users?limit=10'),
        fetch(`http://localhost:8001/analytics/temporal?period=${temporalPeriod}`),
        fetch('http://localhost:8001/analytics/models'),
        fetch('http://localhost:8001/analytics/categories')
      ]);

      // Check if all requests were successful
      const responses = [overviewRes, usersRes, temporalRes, modelsRes, categoriesRes];
      const allSuccessful = responses.every(res => res.ok);
      
      if (!allSuccessful) {
        throw new Error('One or more API endpoints failed');
      }

      const [overviewData, usersData, temporalData, modelsData, categoriesData] = await Promise.all([
        overviewRes.json(),
        usersRes.json(),
        temporalRes.json(),
        modelsRes.json(),
        categoriesRes.json()
      ]);

      // Safely set data with fallbacks
      setOverview(overviewData && !overviewData.error ? overviewData : null);
      setUserAnalytics(usersData && !usersData.error ? usersData : null);
      setTemporalData(temporalData && !temporalData.error ? temporalData : null);
      setModelAnalytics(modelsData && !modelsData.error ? modelsData : null);
      setCategoryAnalytics(categoriesData && !categoriesData.error ? categoriesData : null);
      
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data. Please check that the backend is running on port 8001 and the data files are available.');
      
      // Reset all data to null on error
      setOverview(null);
      setUserAnalytics(null);
      setTemporalData(null);
      setModelAnalytics(null);
      setCategoryAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [temporalPeriod]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 4.5) return 'text-green-600 bg-green-100';
    if (quality >= 4.0) return 'text-blue-600 bg-blue-100';
    if (quality >= 3.5) return 'text-yellow-600 bg-yellow-100';
    if (quality >= 3.0) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const handleSort = (field: keyof UserAnalytics['users'][0]) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedUsers = () => {
    if (!userAnalytics?.users) return [];
    
    return [...userAnalytics.users].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        // Handle dates and other types
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Temporal data sorting functions
  const handleTemporalSort = (field: 'period' | 'prompt_count' | 'total_tokens' | 'avg_quality' | 'unique_users') => {
    if (field === temporalSortField) {
      setTemporalSortDirection(temporalSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTemporalSortField(field);
      setTemporalSortDirection('desc');
    }
  };

  const getSortedTemporalData = () => {
    if (!temporalData?.data) return [];
    
    return [...temporalData.data].sort((a, b) => {
      const aValue = a[temporalSortField as keyof typeof a];
      const bValue = b[temporalSortField as keyof typeof b];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return temporalSortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Model analytics sorting functions
  const handleModelSort = (field: 'model' | 'prompt_count' | 'avg_quality' | 'avg_tokens' | 'total_cost' | 'avg_response_time' | 'usage_percentage') => {
    if (field === modelSortField) {
      setModelSortDirection(modelSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setModelSortField(field);
      setModelSortDirection('desc');
    }
  };

  const getSortedModels = () => {
    if (!modelAnalytics?.models) return [];
    
    return [...modelAnalytics.models].sort((a, b) => {
      const aValue = a[modelSortField as keyof typeof a];
      const bValue = b[modelSortField as keyof typeof b];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return modelSortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Category analytics sorting functions
  const handleCategorySort = (field: 'category' | 'prompt_count' | 'avg_quality' | 'usage_percentage') => {
    if (field === categorySortField) {
      setCategorySortDirection(categorySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCategorySortField(field);
      setCategorySortDirection('desc');
    }
  };

  const getSortedCategories = () => {
    if (!categoryAnalytics?.categories) return [];
    
    return [...categoryAnalytics.categories].sort((a, b) => {
      const aValue = a[categorySortField as keyof typeof a];
      const bValue = b[categorySortField as keyof typeof b];
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return categorySortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Chart data formatting
  const formatChartData = () => {
    if (!temporalData?.data) return [];
    
    return temporalData.data.map(item => ({
      period: item.period_value || item.period,
      prompt_count: item.prompt_count,
      total_tokens: item.total_tokens,
      avg_quality: item.avg_quality,
      unique_users: item.unique_users || 0,
    }));
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 dark:text-blue-400">
              {getText('analytics.prompts')}: {data.prompt_count?.toLocaleString()}
            </p>
            <p className="text-green-600 dark:text-green-400">
              {getText('analytics.tokens')}: {data.total_tokens?.toLocaleString()}
            </p>
            <p className="text-purple-600 dark:text-purple-400">
              {getText('analytics.quality')}: {data.avg_quality}
            </p>
            {temporalPeriod !== 'hourly' && (
              <p className="text-orange-600 dark:text-orange-400">
                {getText('analytics.users')}: {data.unique_users}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'prompt_count': return '#2563eb'; // blue
      case 'total_tokens': return '#16a34a'; // green
      case 'avg_quality': return '#9333ea'; // purple
      case 'unique_users': return '#ea580c'; // orange
      default: return '#2563eb';
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'prompt_count': return getText('analytics.promptCountMetric');
      case 'total_tokens': return getText('analytics.tokensMetric');
      case 'avg_quality': return getText('analytics.qualityMetric');
      case 'unique_users': return getText('analytics.usersMetric');
      default: return metric;
    }
  };

  const SortIcon = ({ field }: { field: keyof UserAnalytics['users'][0] }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  // Temporal Data Sort Icon
  const TemporalSortIcon = ({ field }: { field: 'period' | 'prompt_count' | 'total_tokens' | 'avg_quality' | 'unique_users' }) => {
    if (temporalSortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return temporalSortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Model Analytics Sort Icon
  const ModelSortIcon = ({ field }: { field: 'model' | 'prompt_count' | 'avg_quality' | 'avg_tokens' | 'total_cost' | 'avg_response_time' | 'usage_percentage' }) => {
    if (modelSortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return modelSortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Category Analytics Sort Icon
  const CategorySortIcon = ({ field }: { field: 'category' | 'prompt_count' | 'avg_quality' | 'usage_percentage' }) => {
    if (categorySortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return categorySortDirection === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-300">{getText('analytics.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Overview Stats */}
      {overview ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            {getText('analytics.overview')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {overview.total_prompts?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{getText('analytics.totalPrompts')}</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {overview.unique_users || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{getText('analytics.uniqueUsers')}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {overview.total_tokens?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{getText('analytics.totalTokens')}</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {overview.avg_quality || '0'}/5.0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Avg Quality</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${overview.total_cost?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Cost</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
              <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {overview.date_range?.start ? formatDate(overview.date_range.start) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">to</div>
              <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {overview.date_range?.end ? formatDate(overview.date_range.end) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Date Range</div>
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {getText('analytics.noDataAvailable')}
          </div>
        </div>
      )}

      {/* Temporal Analysis */}
      {temporalData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getText('analytics.temporalAnalysis')}
            </h2>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setTemporalViewMode('table')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    temporalViewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {getText('analytics.tableView')}
                </button>
                <button
                  onClick={() => setTemporalViewMode('chart')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    temporalViewMode === 'chart'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {getText('analytics.chartView')}
                </button>
              </div>
              
              {/* Chart Metric Selector - only show in chart mode */}
              {temporalViewMode === 'chart' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    {getText('analytics.chartMetric')}:
                  </label>
                  <select
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="prompt_count">{getText('analytics.promptCountMetric')}</option>
                    <option value="total_tokens">{getText('analytics.tokensMetric')}</option>
                    <option value="avg_quality">{getText('analytics.qualityMetric')}</option>
                    {temporalPeriod !== 'hourly' && (
                      <option value="unique_users">{getText('analytics.usersMetric')}</option>
                    )}
                  </select>
                </div>
              )}
              
              {/* Table controls - only show in table mode */}
              {temporalViewMode === 'table' && (
                <>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Sorted by {temporalSortField.replace('_', ' ')} ({temporalSortDirection === 'asc' ? '↑' : '↓'})
                  </div>
                  <button
                    onClick={() => {
                      setTemporalSortField('period');
                      setTemporalSortDirection('asc');
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    {getText('analytics.resetSort')}
                  </button>
                </>
              )}
              
              <select
                value={temporalPeriod}
                onChange={(e) => setTemporalPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="hourly">{getText('analytics.hourly') || 'Hourly'}</option>
                <option value="daily">{getText('analytics.daily')}</option>
                <option value="weekly">{getText('analytics.weekly')}</option>
                <option value="monthly">{getText('analytics.monthly')}</option>
              </select>
            </div>
          </div>
          
          {/* Chart View */}
          {temporalViewMode === 'chart' ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="period" 
                    className="text-gray-600 dark:text-gray-300"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-300"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={getMetricColor(chartMetric)}
                    strokeWidth={2}
                    dot={{ fill: getMetricColor(chartMetric), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={getMetricLabel(chartMetric)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleTemporalSort('period')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.period')}
                      <TemporalSortIcon field="period" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleTemporalSort('prompt_count')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.prompts')}
                      <TemporalSortIcon field="prompt_count" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleTemporalSort('total_tokens')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.tokens')}
                      <TemporalSortIcon field="total_tokens" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleTemporalSort('avg_quality')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.avgQuality')}
                      <TemporalSortIcon field="avg_quality" />
                    </div>
                  </th>
                  {temporalPeriod !== 'hourly' && (
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleTemporalSort('unique_users')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.users')}
                        <TemporalSortIcon field="unique_users" />
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {getSortedTemporalData().length > 0 ? (
                  getSortedTemporalData().map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{item.period}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{item.prompt_count}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{item.total_tokens.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${getQualityColor(item.avg_quality)}`}>
                          {item.avg_quality}
                        </span>
                      </td>
                      {temporalPeriod !== 'hourly' && item.unique_users && (
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{item.unique_users}</td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={temporalPeriod === 'hourly' ? 4 : 5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No temporal data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Model Performance */}
      {modelAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getText('analytics.modelPerformance')}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by {modelSortField.replace('_', ' ')} ({modelSortDirection === 'asc' ? '↑' : '↓'})
              </div>
              <button
                onClick={() => {
                  setModelSortField('prompt_count');
                  setModelSortDirection('desc');
                }}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Sort
              </button>
            </div>
          </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('model')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.model')}
                        <ModelSortIcon field="model" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('prompt_count')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.prompts')}
                        <ModelSortIcon field="prompt_count" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('avg_quality')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.quality')}
                        <ModelSortIcon field="avg_quality" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('avg_tokens')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.avgTokens')}
                        <ModelSortIcon field="avg_tokens" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('total_cost')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.cost')}
                        <ModelSortIcon field="total_cost" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => handleModelSort('avg_response_time')}
                    >
                      <div className="flex items-center">
                        {getText('analytics.avgResponseTime')}
                        <ModelSortIcon field="avg_response_time" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedModels().length > 0 ? (
                    getSortedModels().map((model, index) => (
                      <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{model.model}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {model.prompt_count} ({model.usage_percentage}%)
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${getQualityColor(model.avg_quality)}`}>
                            {model.avg_quality}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{model.avg_tokens}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">${model.total_cost}</td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{model.avg_response_time}ms</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No model analytics available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Category Analysis */}
      {categoryAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getText('analytics.categoryDistribution')}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by {categorySortField.replace('_', ' ')} ({categorySortDirection === 'asc' ? '↑' : '↓'})
              </div>
              <button
                onClick={() => {
                  setCategorySortField('prompt_count');
                  setCategorySortDirection('desc');
                }}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Sort
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleCategorySort('category')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.category')}
                      <CategorySortIcon field="category" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleCategorySort('prompt_count')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.prompts')}
                      <CategorySortIcon field="prompt_count" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleCategorySort('usage_percentage')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.usage')}
                      <CategorySortIcon field="usage_percentage" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleCategorySort('avg_quality')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.avgQuality')}
                      <CategorySortIcon field="avg_quality" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedCategories().length > 0 ? (
                  getSortedCategories().slice(0, 10).map((category, index) => (
                    <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{category.category}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{category.prompt_count}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">{category.usage_percentage}%</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${getQualityColor(category.avg_quality)}`}>
                          {category.avg_quality}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No category analytics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Users */}
      {userAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getText('analytics.topUsers')}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getText('analytics.sortedBy')} {sortField.replace('_', ' ')} ({sortDirection === 'asc' ? '↑' : '↓'})
              </div>
              <button
                onClick={() => {
                  setSortField('prompt_count');
                  setSortDirection('desc');
                }}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Reset Sort
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('user_name')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.userName')}
                      <SortIcon field="user_name" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('prompt_count')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.prompts')}
                      <SortIcon field="prompt_count" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('avg_quality')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.avgQuality')}
                      <SortIcon field="avg_quality" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_tokens')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.totalTokens')}
                      <SortIcon field="total_tokens" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('avg_prompt_length')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.avgLength') || 'Avg Length'}
                      <SortIcon field="avg_prompt_length" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_cost')}
                  >
                    <div className="flex items-center">
                      {getText('analytics.totalCost')}
                      <SortIcon field="total_cost" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('first_prompt')}
                  >
                    <div className="flex items-center">
                      Activity Period
                      <SortIcon field="first_prompt" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {userAnalytics && getSortedUsers().length > 0 ? (
                  getSortedUsers().map((user, index) => (
                    <tr key={user.user_id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2">
                        <div className="text-gray-900 dark:text-white font-medium">{user.user_name}</div>
                        <div className="text-sm text-gray-500">{user.user_id}</div>
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-mono">{user.prompt_count}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${getQualityColor(user.avg_quality)}`}>
                          {user.avg_quality}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-mono">{user.total_tokens.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-mono">{user.avg_prompt_length}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-white font-mono">${user.total_cost}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(user.first_prompt)} - {formatDate(user.last_prompt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No user analytics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
