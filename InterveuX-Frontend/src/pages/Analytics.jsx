import { useState, useEffect } from 'react';
import PerformanceAnalytics from '../components/PerformanceAnalytics';
import SmartRecommendations from '../components/SmartRecommendations';
import PDFReports from '../components/PDFReports';
import api from '../lib/api';
import { getUser } from '../utils/auth';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const user = getUser();
      if (!user?.id && !user?._id) return;
      
      const userId = user.id || user._id;
      const res = await api.get('/api/dashboard/');
      setData(res.data);
    } catch (error) {
      console.error('Analytics data fetch error:', error);
      setData({ resumes: [], interviews: [], coding: [] });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'performance', label: 'Performance Analytics', icon: '📊' },
    { id: 'recommendations', label: 'Smart Recommendations', icon: '🎯' },
    { id: 'reports', label: 'PDF Reports', icon: '📄' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">Track your progress and get personalized insights</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'performance' && <PerformanceAnalytics data={data} />}
              {activeTab === 'recommendations' && <SmartRecommendations data={data} />}
              {activeTab === 'reports' && <PDFReports data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;