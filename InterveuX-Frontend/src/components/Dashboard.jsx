import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewStats from './InterviewStats';
import InterviewSettings from './InterviewSettings';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/interviews/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startInterview = (settings) => {
    navigate('/interview', { state: { settings } });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Dashboard</h1>
          <p className="text-gray-600 mt-2">Practice and track your interview performance</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => startInterview({ difficulty: 'beginner', practiceMode: false })}
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="text-blue-600 font-semibold">Start Interview</div>
                  <div className="text-sm text-gray-600">Beginner Level</div>
                </button>
                <button
                  onClick={() => startInterview({ difficulty: 'intermediate', practiceMode: false })}
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 transition-colors"
                >
                  <div className="text-green-600 font-semibold">Start Interview</div>
                  <div className="text-sm text-gray-600">Intermediate Level</div>
                </button>
                <button
                  onClick={() => startInterview({ difficulty: 'advanced', practiceMode: false })}
                  className="p-4 border-2 border-red-200 rounded-lg hover:border-red-400 transition-colors"
                >
                  <div className="text-red-600 font-semibold">Start Interview</div>
                  <div className="text-sm text-gray-600">Advanced Level</div>
                </button>
                <button
                  onClick={() => startInterview({ practiceMode: true })}
                  className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors"
                >
                  <div className="text-purple-600 font-semibold">Practice Mode</div>
                  <div className="text-sm text-gray-600">No saving</div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Interview Settings
              </button>
              <button
                onClick={() => navigate('/results')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                View Results
              </button>
            </div>
          </div>
        </div>

        {showSettings && (
          <div className="mb-8">
            <InterviewSettings onStartInterview={startInterview} />
          </div>
        )}

        {stats && <InterviewStats stats={stats} />}
      </div>
    </div>
  );
};

export default Dashboard;