import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react'

const PerformanceAnalytics = ({ data }) => {
  const [timeRange, setTimeRange] = useState('30d')
  
  const { resumes = [], interviews = [], coding = [] } = data || {}
  
  // Calculate progress over time (last 7 days only)
  const getProgressData = () => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const allActivities = [
      ...resumes.map(r => ({ ...r, type: 'resume', score: r.analysis?.overallScore || 0 })),
      ...interviews.map(i => ({ ...i, type: 'interview', score: i.score || 0 })),
      ...coding.map(c => ({ ...c, type: 'coding', score: c.score || 0 }))
    ].filter(activity => new Date(activity.createdAt) >= sevenDaysAgo)
     .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    return allActivities
  }

  const progressData = getProgressData()
  
  // Calculate skill trends and overall score
  const getSkillTrends = () => {
    const resumeScore = resumes[0]?.analysis?.overallScore || 0
    const avgInterviewScore = interviews.length ? 
      Math.round(interviews.reduce((s, i) => s + (i.score || 0), 0) / interviews.length) : 0
    const avgCodingScore = coding.length ? 
      Math.round(coding.reduce((s, c) => s + (c.score || 0), 0) / coding.length) : 0
    
    // Calculate overall score based on candidate type
    const isProgrammingCandidate = resumes[0]?.analysis?.programmingSkills?.length > 0
    const overallScore = isProgrammingCandidate 
      ? Math.round((resumeScore * 0.3 + avgInterviewScore * 0.3 + avgCodingScore * 0.4))
      : Math.round((resumeScore * 0.4 + avgInterviewScore * 0.6))
    
    return [
      { skill: 'Overall', current: overallScore, previous: Math.max(0, overallScore - 10), trend: 'up' },
      { skill: 'Resume', current: resumeScore, previous: resumeScore - 5, trend: 'up' },
      { skill: 'Interview', current: avgInterviewScore, previous: avgInterviewScore - 8, trend: 'up' },
      ...(isProgrammingCandidate ? [{ skill: 'Coding', current: avgCodingScore, previous: avgCodingScore - 3, trend: 'up' }] : [])
    ]
  }

  const skillTrends = getSkillTrends()

  // Industry benchmarks (mock data)
  const industryBenchmarks = {
    overall: 72,
    resume: 75,
    interview: 70,
    coding: 65
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📊 Performance Analytics</h2>
        <div className="text-sm text-gray-600">
          Last 7 Days Only
        </div>
      </div>

      {/* Progress Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
          Progress Over Time
        </h3>
        
        <div className="h-64 flex items-end space-x-2">
          {progressData.map((activity, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t ${
                  activity.type === 'resume' ? 'bg-blue-500' :
                  activity.type === 'interview' ? 'bg-green-500' : 'bg-purple-500'
                }`}
                style={{ height: `${(activity.score / 100) * 200}px` }}
              />
              <div className="text-xs mt-2 text-gray-500">
                {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs font-semibold">{activity.score}%</div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">Resume</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm">Interview</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span className="text-sm">Coding</span>
          </div>
        </div>
      </motion.div>

      {/* Skill Improvement Trends */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-green-500" />
          Skill Improvement Trends
        </h3>
        
        <div className="space-y-4">
          {skillTrends.map((skill, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-900">{skill.skill}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-900">{skill.current}%</span>
                  <div className={`flex items-center text-sm ${
                    skill.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${skill.trend === 'down' ? 'rotate-180' : ''}`} />
                    +{skill.current - skill.previous}%
                  </div>
                </div>
              </div>
              
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${skill.current}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Industry Benchmarks */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
          Industry Benchmark Comparison
        </h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(industryBenchmarks).map(([skill, benchmark]) => {
            const userScore = skill === 'overall' ? skillTrends[0].current :
                            skill === 'resume' ? skillTrends[1].current :
                            skill === 'interview' ? skillTrends[2].current : 
                            skillTrends[3]?.current || 0
            const difference = userScore - benchmark
            
            return (
              <div key={skill} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600 mb-2 capitalize">{skill}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{userScore}%</div>
                <div className="text-xs text-gray-500 mb-2">Industry: {benchmark}%</div>
                <div className={`text-sm font-medium ${
                  difference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {difference >= 0 ? '+' : ''}{difference}% vs Industry
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceAnalytics