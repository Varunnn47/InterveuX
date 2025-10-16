import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Video, Code, BarChart3, Calendar, Trophy, ArrowRight, TrendingUp } from 'lucide-react'
import { getUser } from '../utils/auth'
import { fadeInUp, staggerContainer } from '../utils/motion'
import api from '../lib/api'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalInterviews: 0,
    codingChallenges: 0,
    averageScore: 0,
    lastActivity: 'No activity yet'
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = getUser()
    setUser(userData)
    // Always fetch dashboard data - let backend use authenticated user
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('intervuex_token')
      if (!token) {
        console.log('⚠️ No auth token found')
        setLoading(false)
        return
      }
      
      console.log('📊 Fetching dashboard data with auth...')
      const response = await api.get('/api/dashboard/')
      const data = response.data
      
      console.log('✅ Dashboard data received:', {
        interviews: data.totalInterviews,
        coding: data.totalCodingChallenges,
        resumes: data.totalResumes,
        avgScore: data.averageScore,
        interviewDetails: data.interviews?.slice(0, 3)
      })
      
      setStats({
        totalInterviews: data.totalInterviews || 0,
        codingChallenges: data.totalCodingChallenges || 0,
        averageScore: data.averageScore || 0,
        lastActivity: data.lastActivity || 'No activity yet'
      })
      setRecentActivities(data.recentActivities || [])
      setResumes(data.resumes || [])
    } catch (error) {
      console.error('❌ Dashboard error:', error.response?.data || error.message)
      if (error.response?.status === 401) {
        localStorage.removeItem('intervuex_token')
        window.location.href = '/login'
        return
      }
      setStats({
        totalInterviews: 0,
        codingChallenges: 0,
        averageScore: 0,
        lastActivity: 'No activity yet'
      })
      setRecentActivities([])
      setResumes([])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      icon: FileText,
      title: '1. Analyze Resume',
      description: 'Start with AI-powered resume feedback',
      link: '/resume-analyzer',
      color: 'bg-blue-500',
      step: 1
    },
    {
      icon: Code,
      title: '2. Coding Challenge',
      description: 'Test your programming skills',
      link: '/coding-round',
      color: 'bg-purple-500',
      step: 2
    },
    {
      icon: Video,
      title: '3. Mock Interview',
      description: 'Practice with AI interviewer',
      link: '/interview',
      color: 'bg-green-500',
      step: 3
    },
    {
      icon: BarChart3,
      title: '4. View Results',
      description: 'Check your complete performance',
      link: '/results',
      color: 'bg-orange-500',
      step: 4
    }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'interview': return Video
      case 'coding': return Code
      case 'resume': return FileText
      default: return BarChart3
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="font-body text-gray-600 mt-2">
            Follow the complete interview preparation workflow
          </p>
          
          {/* Workflow Progress */}
          <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Preparation Workflow</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  (stats.totalInterviews + stats.codingChallenges + (resumes?.length || 0)) > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm text-gray-600">Resume</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-1 rounded ${
                  stats.codingChallenges > 0 ? 'bg-green-500' : 'bg-gray-200'
                } transition-all duration-300`} style={{width: stats.codingChallenges > 0 ? '100%' : '0%'}}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stats.codingChallenges > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm text-gray-600">Coding</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-1 rounded ${
                  stats.totalInterviews > 0 ? 'bg-green-500' : 'bg-gray-200'
                } transition-all duration-300`} style={{width: stats.totalInterviews > 0 ? '100%' : '0%'}}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stats.totalInterviews > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm text-gray-600">Interview</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-1 rounded ${
                  (stats.totalInterviews > 0 && stats.codingChallenges > 0) ? 'bg-green-500' : 'bg-gray-200'
                } transition-all duration-300`} style={{width: (stats.totalInterviews > 0 && stats.codingChallenges > 0) ? '100%' : '0%'}}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  (stats.totalInterviews > 0 && stats.codingChallenges > 0) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  4
                </div>
                <span className="ml-2 text-sm text-gray-600">Results</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Video className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Coding Challenges</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.codingChallenges}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Code className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Activity</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.lastActivity}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                      <div className="flex items-center text-primary text-sm font-medium">
                        <span>Get Started</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-xl font-semibold text-gray-900 mb-6">Recent Activities</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
                      <div className="bg-gray-200 p-2 rounded-lg w-8 h-8"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <div className={`text-sm font-semibold ${getScoreColor(activity.score)}`}>
                        {activity.score}%
                      </div>
                    </div>
                  )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activities</p>
                  <p className="text-sm text-gray-400 mt-1">Start practicing to see your progress here</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link 
                  to="/results"
                  className="flex items-center justify-center text-primary hover:text-primary-dark font-medium text-sm"
                >
                  <span>View All Activities</span>
                  <TrendingUp className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard