import React, { useState } from 'react';
import { Settings, Clock, Hash, Mic, Video } from 'lucide-react';

const InterviewSettings = ({ onStartInterview, onClose }) => {
  const [settings, setSettings] = useState({
    difficulty: 'intermediate',
    questionCount: 5,
    timePerQuestion: 120,
    questionTypes: ['technical', 'behavioral'],
    enableRecording: false,
    enableAIFeedback: true,
    practiceMode: false
  });

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', questions: 3, description: 'Basic questions' },
    { value: 'intermediate', label: 'Intermediate', questions: 4, description: 'Standard difficulty' },
    { value: 'advanced', label: 'Advanced', questions: 3, description: 'Complex scenarios' }
  ];

  const questionTypeOptions = [
    { value: 'technical', label: 'Technical', icon: '💻' },
    { value: 'behavioral', label: 'Behavioral', icon: '🧠' },
    { value: 'hr', label: 'HR Questions', icon: '👥' }
  ];

  const handleStart = () => {
    onStartInterview(settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Interview Settings
          </h2>
          <button onClick={onClose} className="bg-red-500 text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-600">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty Level</label>
            <div className="space-y-2">
              {difficultyOptions.map(option => (
                <label key={option.value} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={settings.difficulty === option.value}
                    onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Question Types</label>
            <div className="space-y-2">
              {questionTypeOptions.map(option => (
                <label key={option.value} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.questionTypes.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({...settings, questionTypes: [...settings.questionTypes, option.value]});
                      } else {
                        setSettings({...settings, questionTypes: settings.questionTypes.filter(t => t !== option.value)});
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="mr-2">{option.icon}</span>
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Per Question (seconds)
            </label>
            <select
              value={settings.timePerQuestion}
              onChange={(e) => setSettings({...settings, timePerQuestion: parseInt(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={180}>3 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableRecording}
                onChange={(e) => setSettings({...settings, enableRecording: e.target.checked})}
                className="mr-2"
              />
              <Video className="w-4 h-4 mr-1" />
              Enable Recording
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableAIFeedback}
                onChange={(e) => setSettings({...settings, enableAIFeedback: e.target.checked})}
                className="mr-2"
              />
              <Mic className="w-4 h-4 mr-1" />
              AI Feedback
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.practiceMode}
                onChange={(e) => setSettings({...settings, practiceMode: e.target.checked})}
                className="mr-2"
              />
              Practice Mode (No Save)
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            OK
          </button>
          <button
            onClick={handleStart}
            disabled={settings.questionTypes.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSettings;