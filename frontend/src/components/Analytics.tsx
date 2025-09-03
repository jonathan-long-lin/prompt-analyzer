'use client';

import { useState, useEffect } from 'react';

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading analytics...</div>
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
            Dataset Overview
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {overview.total_prompts?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Prompts</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {overview.unique_users || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Unique Users</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {overview.total_tokens?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Tokens</div>
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
            No overview data available
          </div>
        </div>
      )}

      {/* Temporal Analysis */}
      {temporalData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Usage Over Time
            </h2>
            <select
              value={temporalPeriod}
              onChange={(e) => setTemporalPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Period</th>
                  <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Prompts</th>
                  <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Tokens</th>
                  <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Avg Quality</th>
                  {temporalPeriod !== 'hourly' && (
                    <th className="px-4 py-2 text-left text-gray-900 dark:text-white">Users</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {temporalData.data && temporalData.data.length > 0 ? (
                  temporalData.data.map((item, index) => (
                    <tr key={index} className="border-b dark:border-gray-600">
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
        </div>
      )}

      {/* Model Performance and Categories Side by Side */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Model Performance */}
        {modelAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Model Performance
            </h2>
            
            <div className="space-y-4">
              {modelAnalytics.models && modelAnalytics.models.length > 0 ? (
                modelAnalytics.models.map((model, index) => (
                  <div key={index} className="border dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{model.model}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${getQualityColor(model.avg_quality)}`}>
                        {model.avg_quality}/5.0
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div>Prompts: {model.prompt_count} ({model.usage_percentage}%)</div>
                      <div>Avg Tokens: {model.avg_tokens}</div>
                      <div>Total Cost: ${model.total_cost}</div>
                      <div>Avg Response: {model.avg_response_time}ms</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No model analytics available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Analysis */}
        {categoryAnalytics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Category Distribution
            </h2>
            
            <div className="space-y-3">
              {categoryAnalytics.categories && categoryAnalytics.categories.length > 0 ? (
                categoryAnalytics.categories.slice(0, 10).map((category, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{category.category}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {category.prompt_count} prompts ({category.usage_percentage}%)
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${getQualityColor(category.avg_quality)}`}>
                      {category.avg_quality}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No category analytics available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top Users */}
      {userAnalytics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Top Users (by Activity)
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sorted by {sortField.replace('_', ' ')} ({sortDirection === 'asc' ? '↑' : '↓'})
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
                      User
                      <SortIcon field="user_name" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('prompt_count')}
                  >
                    <div className="flex items-center">
                      Prompts
                      <SortIcon field="prompt_count" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('avg_quality')}
                  >
                    <div className="flex items-center">
                      Avg Quality
                      <SortIcon field="avg_quality" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_tokens')}
                  >
                    <div className="flex items-center">
                      Total Tokens
                      <SortIcon field="total_tokens" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('avg_prompt_length')}
                  >
                    <div className="flex items-center">
                      Avg Length
                      <SortIcon field="avg_prompt_length" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_cost')}
                  >
                    <div className="flex items-center">
                      Total Cost
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
