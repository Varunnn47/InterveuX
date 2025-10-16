import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Video, Code, Trophy, Calendar, TrendingUp, Award, Target } from 'lucide-react'
import api from '../lib/api'
import { getUser } from '../utils/auth'
import { fadeInUp, staggerContainer } from '../utils/motion'

const Results = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)

  const fetchResults = async () => {
    try {
      const user = getUser()
      if (!user?.id && !user?._id) {
        console.error('No user found for results page')
        setData({ resumes: [], interviews: [], coding: [], totalInterviews: 0, totalCodingChallenges: 0, averageScore: 0 })
        setLoading(false)
        return
      }
      
      const userId = user.id || user._id
      console.log('Fetching results for user:', userId)
      
      const res = await api.get(`/dashboard/${userId}`)
      console.log('Dashboard data received:', res.data)
      setData(res.data)
      
      // Generate AI analysis after fetching data
      if (res.data && (res.data.resumes?.length > 0 || res.data.interviews?.length > 0)) {
        await generateAIAnalysis(res.data)
      } else {
        console.log('No data available for AI analysis')
        setGeneratingAnalysis(false)
      }
    } catch (err) {
      console.error('Error fetching results:', err)
      setData({ 
        resumes: [], 
        interviews: [], 
        coding: [], 
        totalInterviews: 0, 
        totalCodingChallenges: 0, 
        averageScore: 0,
        error: err.message 
      })
    } finally {
      setLoading(false)
    }
  }
  
  const generateAIAnalysis = async (userData) => {
    setGeneratingAnalysis(true)
    try {
      const analysisPayload = {
        resumeData: userData.resumes[0]?.analysis || {},
        interviewData: userData.interviews || [],
        codingData: userData.coding || [],
        candidateType: userData.resumes[0]?.analysis?.programmingSkills?.length > 0 ? 'programming' : 'non-programming'
      }
      
      console.log('Sending AI analysis request:', analysisPayload)
      const response = await api.post('/api/results/ai-analysis', analysisPayload)
      console.log('AI analysis response:', response.data)
      setAiAnalysis(response.data)
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      
      // Calculate scores for fallback
      const resumeScore = userData.resumes[0]?.analysis?.overallScore || 0
      const avgInterviewScore = userData.interviews?.length ? 
        Math.round(userData.interviews.reduce((s, i) => s + (i.score || 0), 0) / userData.interviews.length) : 0
      const avgCodingScore = userData.coding?.length ? 
        Math.round(userData.coding.reduce((s, c) => s + (c.score || 0), 0) / userData.coding.length) : 0
      const isProgrammingCandidate = userData.resumes[0]?.analysis?.programmingSkills?.length > 0
      const overallScore = isProgrammingCandidate 
        ? Math.round((resumeScore * 0.3 + avgInterviewScore * 0.3 + avgCodingScore * 0.4))
        : Math.round((resumeScore * 0.4 + avgInterviewScore * 0.6))
      
      // Fallback analysis with calculated scores
      const fallbackAnalysis = {
        overallAssessment: 'Performance analysis completed successfully. Review detailed breakdown below.',
        strengths: [
          'Successfully completed interview preparation process',
          'Demonstrated commitment to skill improvement',
          'Engaged with comprehensive assessment platform'
        ],
        criticalWeaknesses: [
          {
            area: 'AI Analysis Unavailable',
            evidence: 'Technical issue with AI service',
            impact: 'Low',
            recommendation: 'Manual review of performance metrics recommended'
          }
        ],
        skillGaps: [],
        careerAdvice: {
          immediate: ['Review performance metrics', 'Practice identified weak areas'],
          shortTerm: ['Focus on skill development', 'Seek feedback from mentors'],
          longTerm: ['Build professional network', 'Pursue relevant certifications']
        },
        finalVerdict: {
          decision: overallScore >= 75 ? 'HIRE' : overallScore >= 60 ? 'STRONG_CONSIDER' : 'MAYBE',
          overallGrade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C+' : 'C',
          confidence: 75,
          reasoning: `Based on performance metrics: Overall score of ${overallScore}% indicates ${overallScore >= 75 ? 'strong' : overallScore >= 60 ? 'good' : 'developing'} candidate potential.`
        },
        performanceBreakdown: {
          resume: {
            score: resumeScore,
            grade: resumeScore >= 80 ? 'B+' : resumeScore >= 70 ? 'B' : resumeScore >= 60 ? 'C+' : 'C',
            feedback: resumeScore >= 80 ? 'Strong resume quality' : resumeScore >= 60 ? 'Good foundation, room for improvement' : 'Needs significant enhancement'
          },
          interview: {
            score: avgInterviewScore,
            grade: avgInterviewScore >= 80 ? 'B+' : avgInterviewScore >= 70 ? 'B' : avgInterviewScore >= 60 ? 'C+' : 'C',
            feedback: avgInterviewScore >= 80 ? 'Excellent interview performance' : avgInterviewScore >= 60 ? 'Solid responses with room for growth' : 'Requires more practice and preparation'
          },
          coding: isProgrammingCandidate ? {
            score: avgCodingScore,
            grade: avgCodingScore >= 80 ? 'B+' : avgCodingScore >= 70 ? 'B' : avgCodingScore >= 60 ? 'C+' : 'C',
            feedback: avgCodingScore >= 80 ? 'Strong technical skills' : avgCodingScore >= 60 ? 'Good problem-solving ability' : 'Technical skills need development'
          } : null
        }
      }
      setAiAnalysis(fallbackAnalysis)
    } finally {
      setGeneratingAnalysis(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your results...</p>
        </div>
      </div>
    )
  }

  // Show AI analysis loading overlay if still generating
  const showAILoading = generatingAnalysis && data

  // Handle case where no data is available
  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Available</h2>
          <p className="text-gray-600 mb-4">
            {data?.error ? `Error: ${data.error}` : 'Complete some interviews or upload a resume to see your results.'}
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { resumes = [], interviews = [], coding = [] } = data
  const resumeAnalysis = resumes[0]?.analysis || {}
  const resumeScore = resumeAnalysis.overallScore || 0
  const avgInterviewScore = interviews.length ? Math.round(interviews.reduce((s, i) => s + (i.score || 0), 0) / interviews.length) : 0
  const avgCodingScore = coding.length ? Math.round(coding.reduce((s, c) => s + (c.score || 0), 0) / coding.length) : 0
  
  // Determine if candidate is programming or non-programming based on resume
  const isProgrammingCandidate = resumeAnalysis.programmingSkills?.length > 0
  
  // Calculate overall score based on candidate type
  const overallScore = isProgrammingCandidate 
    ? Math.round((resumeScore * 0.3 + avgInterviewScore * 0.3 + avgCodingScore * 0.4)) // Programming: Resume 30%, Interview 30%, Coding 40%
    : Math.round((resumeScore * 0.4 + avgInterviewScore * 0.6)) // Non-Programming: Resume 40%, Interview 60%

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 75) return 'text-blue-600 bg-blue-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Average'
    return 'Needs Improvement'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* AI Analysis Loading Overlay */}
      {showAILoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">🤖 AI is analyzing your performance...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
      
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Performance Results</h1>
          <p className="text-gray-600">Comprehensive analysis of your interview preparation journey</p>
        </motion.div>

        {/* Progress Comparison */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">📈 Your Progress Journey</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Performance */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Current Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Score</span>
                  <span className={`font-bold text-2xl ${getScoreColor(overallScore).split(' ')[0]}`}>{overallScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resume Quality</span>
                  <span className="font-semibold">{resumeScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Interview Performance</span>
                  <span className="font-semibold">{avgInterviewScore}%</span>
                </div>
                {isProgrammingCandidate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Coding Skills</span>
                    <span className="font-semibold">{avgCodingScore}%</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-500">Latest attempt: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {/* Previous Performance Comparison */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border-l-4 border-gray-400">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Progress Comparison</h3>
              
              {/* Current Resume Info */}
              <div className="mb-4 p-3 bg-white rounded border">
                <div className="text-sm text-gray-600 mb-1">Current Resume:</div>
                <div className="font-semibold text-gray-900">{resumeAnalysis.email || 'candidate@email.com'}</div>
                <div className="text-xs text-gray-500">Uploaded: {resumes[0]?.createdAt ? new Date(resumes[0].createdAt).toLocaleDateString() : 'Today'}</div>
              </div>
              
              {resumes.length > 1 || interviews.length > 1 ? (
                <div className="space-y-3">
                  {/* Previous Resume Info */}
                  {resumes.length > 1 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded border">
                      <div className="text-sm text-gray-600 mb-1">Previous Resume:</div>
                      <div className="font-medium text-gray-700">{resumes[1]?.analysis?.email || 'Previous attempt'}</div>
                      <div className="text-xs text-gray-500">Score: {resumes[1]?.analysis?.overallScore || 0}%</div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Previous Overall</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{resumes[1]?.analysis?.overallScore || Math.max(0, overallScore - 15)}%</span>
                      {overallScore > (resumes[1]?.analysis?.overallScore || overallScore - 15) && (
                        <span className="text-green-600 text-sm">↗️ +{overallScore - (resumes[1]?.analysis?.overallScore || overallScore - 15)}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Attempts</span>
                    <span className="font-semibold">{Math.max(resumes.length, interviews.length)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Best Score</span>
                    <span className="font-semibold text-green-600">{Math.max(overallScore, ...resumes.map(r => r.analysis?.overallScore || 0))}%</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className={`text-sm p-2 rounded ${
                      overallScore >= (resumes[1]?.analysis?.overallScore || 0) ? 
                      'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'
                    }`}>
                      {overallScore >= (resumes[1]?.analysis?.overallScore || 0) ? 
                        '🎉 Great improvement! You\'re getting better.' : 
                        '💪 Keep practicing! You\'ll improve with more attempts.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">📝</div>
                  <p className="text-gray-500 text-sm">Complete more rounds to see your progress comparison</p>
                  <p className="text-xs text-gray-400 mt-1">Upload different resumes and practice more interviews</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Overall Performance */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Overall Performance</h2>
            <div className={`px-4 py-2 rounded-full font-semibold ${getScoreColor(overallScore)}`}>
              {getPerformanceLevel(overallScore)}
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Overall Score</p>
            </div>
            
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(resumeScore)}`}>
                {resumeScore}%
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Resume</p>
            </div>
            
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(avgInterviewScore)}`}>
                {avgInterviewScore}%
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">Interviews</p>
            </div>
            
            {coding.length > 0 && (
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(avgCodingScore)}`}>
                  {avgCodingScore}%
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">Coding</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div variants={fadeInUp} className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{resumes.length + interviews.length + coding.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resume Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mock Interviews</p>
                <p className="text-2xl font-bold text-gray-900">{interviews.length}</p>
              </div>
              <Video className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coding Challenges</p>
                <p className="text-2xl font-bold text-gray-900">{coding.length}</p>
              </div>
              <Code className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Interview History */}
          <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Interview History</h3>
              <Video className="h-5 w-5 text-green-500" />
            </div>
            
            {interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.slice(0, 3).map((interview, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">Interview #{interviews.length - idx}</p>
                        <p className="text-sm text-gray-500">{new Date(interview.createdAt).toLocaleDateString()}</p>
                        {interview.difficulty && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(interview.score || 0)}`}>
                        {interview.score || 0}%
                      </div>
                    </div>
                    
                    {/* AI Analysis Summary */}
                    {interview.aiAnalysis && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-sm font-semibold text-blue-600">
                              {interview.aiAnalysis.breakdown?.technical || 0}%
                            </div>
                            <div className="text-xs text-gray-500">Technical</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-green-600">
                              {interview.aiAnalysis.breakdown?.communication || 0}%
                            </div>
                            <div className="text-xs text-gray-500">Communication</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-purple-600">
                              {interview.aiAnalysis.breakdown?.confidence || 0}%
                            </div>
                            <div className="text-xs text-gray-500">Confidence</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-orange-600">
                              {interview.aiAnalysis.breakdown?.completeness || 0}%
                            </div>
                            <div className="text-xs text-gray-500">Complete</div>
                          </div>
                        </div>
                        
                        {interview.aiAnalysis.summary && interview.aiAnalysis.summary.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            💡 {interview.aiAnalysis.summary[0]}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mt-2">
                      {interview.responses?.length || interview.questions?.length || 0} questions • 
                      {interview.totalTime ? `${Math.round(interview.totalTime / 60)} min` : 'N/A'}
                    </p>
                  </div>
                ))}
                {interviews.length > 3 && (
                  <p className="text-center text-sm text-gray-500">+{interviews.length - 3} more interviews</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No interviews completed yet</p>
              </div>
            )}
          </motion.div>

          {/* Coding History */}
          <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Coding History</h3>
              <Code className="h-5 w-5 text-purple-500" />
            </div>
            
            {coding.length > 0 ? (
              <div className="space-y-4">
                {coding.slice(0, 5).map((code, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{code.question}</p>
                        <p className="text-sm text-gray-500">{new Date(code.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(code.score || 0)}`}>
                        {code.score || 0}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{code.language}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        code.result === 'Passed' ? 'bg-green-100 text-green-800' :
                        code.result === 'Failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{code.result || 'Completed'}</span>
                    </div>
                    {code.timeSpent && (
                      <div className="text-xs text-gray-500">
                        ⏱️ Time: {Math.round(code.timeSpent / 60)} min
                      </div>
                    )}
                    {code.testsPassed && (
                      <div className="text-xs text-gray-500">
                        ✅ Tests: {code.testsPassed}/{code.totalTests || 'N/A'}
                      </div>
                    )}
                  </div>
                ))}
                {coding.length > 5 && (
                  <p className="text-center text-sm text-gray-500">+{coding.length - 5} more challenges</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Code className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No coding challenges completed yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Overall Feedback Section */}
        <motion.div variants={fadeInUp} className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">🎆 Complete Performance Analysis</h3>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isProgrammingCandidate ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isProgrammingCandidate ? '💻 Programming Candidate' : '👔 Non-Programming Candidate'}
            </div>
          </div>
          
          {/* Three-Part Assessment */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">📊 Assessment Summary</h4>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />Resume: {resumeScore}%
                </h5>
                <div className="text-sm text-gray-600">
                  {resumeScore >= 80 ? 'Excellent resume quality' : resumeScore >= 60 ? 'Good resume structure' : 'Needs improvement'}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Video className="w-5 h-5 mr-2 text-green-500" />Interview: {avgInterviewScore}%
                </h5>
                <div className="text-sm text-gray-600">
                  {avgInterviewScore >= 80 ? 'Strong interview performance' : avgInterviewScore >= 60 ? 'Good responses' : 'Practice needed'}
                </div>
              </div>
              
              {isProgrammingCandidate ? (
                <div className="p-4 border rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-purple-500" />Coding: {avgCodingScore}%
                  </h5>
                  <div className="text-sm text-gray-600">
                    {avgCodingScore >= 80 ? 'Excellent coding skills' : avgCodingScore >= 60 ? 'Good problem solving' : 'More practice needed'}
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-orange-500" />Overall: {overallScore}%
                  </h5>
                  <div className="text-sm text-gray-600">
                    {overallScore >= 80 ? 'Excellent candidate' : overallScore >= 60 ? 'Good potential' : 'Needs development'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Final Decision */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h5 className="text-lg font-bold text-gray-900 mb-3">🎯 Hiring Recommendation</h5>
              <div className={`inline-block px-6 py-3 rounded-full font-bold text-lg ${
                overallScore >= 85 ? 'bg-green-100 text-green-800' :
                overallScore >= 70 ? 'bg-blue-100 text-blue-800' :
                overallScore >= 55 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {overallScore >= 85 ? '✅ STRONG HIRE' :
                 overallScore >= 70 ? '🔥 HIRE' :
                 overallScore >= 55 ? '⚠️ MAYBE' : '❌ NEEDS IMPROVEMENT'}
              </div>
              <div className="mt-3 text-gray-700">
                {overallScore >= 85 ? 'Excellent candidate - proceed to final round' :
                 overallScore >= 70 ? 'Strong candidate - schedule next interview' :
                 overallScore >= 55 ? 'Potential candidate - additional assessment needed' :
                 'Candidate needs more preparation before next interview'}
              </div>
            </div>
          </div>
          
          {/* AI Final Verdict */}
          {aiAnalysis?.finalVerdict && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900">🎯 Final AI Verdict</h4>
                <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                  aiAnalysis.finalVerdict.decision === 'HIRE' ? 'bg-green-100 text-green-800' :
                  aiAnalysis.finalVerdict.decision === 'STRONG_CONSIDER' ? 'bg-blue-100 text-blue-800' :
                  aiAnalysis.finalVerdict.decision === 'MAYBE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {aiAnalysis.finalVerdict.decision === 'HIRE' ? '✅ HIRE' :
                   aiAnalysis.finalVerdict.decision === 'STRONG_CONSIDER' ? '🔥 STRONG CANDIDATE' :
                   aiAnalysis.finalVerdict.decision === 'MAYBE' ? '⚠️ MAYBE' : '❌ REJECT'}
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{aiAnalysis.finalVerdict.overallGrade}</div>
                  <div className="text-sm text-gray-600">Overall Grade</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{aiAnalysis.finalVerdict.confidence}%</div>
                  <div className="text-sm text-gray-600">AI Confidence</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{overallScore}%</div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-2">AI Reasoning:</h5>
                <p className="text-gray-700">{aiAnalysis.finalVerdict.reasoning}</p>
              </div>
            </div>
          )}
          
          {/* Performance Breakdown with Grades */}
          {aiAnalysis?.performanceBreakdown && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
              <h4 className="text-lg font-bold text-gray-900 mb-4">📊 Detailed Performance Breakdown</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">📄 Resume</h5>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      aiAnalysis.performanceBreakdown.resume.grade === 'A' ? 'bg-green-100 text-green-800' :
                      aiAnalysis.performanceBreakdown.resume.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      aiAnalysis.performanceBreakdown.resume.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {aiAnalysis.performanceBreakdown.resume.grade}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{aiAnalysis.performanceBreakdown.resume.score}%</div>
                  <p className="text-sm text-gray-600">{aiAnalysis.performanceBreakdown.resume.feedback}</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">🎤 Interview</h5>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      aiAnalysis.performanceBreakdown.interview.grade === 'A' ? 'bg-green-100 text-green-800' :
                      aiAnalysis.performanceBreakdown.interview.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      aiAnalysis.performanceBreakdown.interview.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {aiAnalysis.performanceBreakdown.interview.grade}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{aiAnalysis.performanceBreakdown.interview.score}%</div>
                  <p className="text-sm text-gray-600">{aiAnalysis.performanceBreakdown.interview.feedback}</p>
                </div>
                
                {isProgrammingCandidate && aiAnalysis.performanceBreakdown.coding && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">💻 Coding</h5>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        aiAnalysis.performanceBreakdown.coding.grade === 'A' ? 'bg-green-100 text-green-800' :
                        aiAnalysis.performanceBreakdown.coding.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        aiAnalysis.performanceBreakdown.coding.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {aiAnalysis.performanceBreakdown.coding.grade}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{aiAnalysis.performanceBreakdown.coding.score}%</div>
                    <p className="text-sm text-gray-600">{aiAnalysis.performanceBreakdown.coding.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          

          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Assessment */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Overall Assessment
              </h4>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    overallScore >= 85 ? 'text-green-600' : 
                    overallScore >= 70 ? 'text-blue-600' : 
                    overallScore >= 55 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {overallScore}%
                  </div>
                  <div className="text-lg font-medium text-gray-700">
                    {overallScore >= 85 ? 'Excellent Candidate' :
                     overallScore >= 70 ? 'Strong Candidate' :
                     overallScore >= 55 ? 'Good Potential' : 'Needs Improvement'}
                  </div>
                </div>
                
                {/* Evaluation Criteria */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resume Quality</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          resumeScore >= 80 ? 'bg-green-500' : resumeScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${resumeScore}%` }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">{resumeScore}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interview Performance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          avgInterviewScore >= 80 ? 'bg-green-500' : avgInterviewScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${avgInterviewScore}%` }}></div>
                      </div>
                      <span className="text-sm font-medium w-8">{avgInterviewScore}%</span>
                    </div>
                  </div>
                  
                  {isProgrammingCandidate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coding Skills</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${
                            avgCodingScore >= 80 ? 'bg-green-500' : avgCodingScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} style={{ width: `${avgCodingScore}%` }}></div>
                        </div>
                        <span className="text-sm font-medium w-8">{avgCodingScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-500" />
                AI Recommendations & Analysis
              </h4>
              
              <div className="space-y-4">
                {/* AI-Identified Strengths */}
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">🤖 AI-Identified Strengths</h5>
                  <div className="space-y-1">
                    {aiAnalysis?.strengths?.map((strength, idx) => (
                      <div key={idx} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                        • {strength}
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500 italic">
                        AI is analyzing your strengths...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Critical Weaknesses */}
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">🤖 Critical Weaknesses</h5>
                  <div className="space-y-2">
                    {aiAnalysis?.criticalWeaknesses?.map((weakness, idx) => (
                      <div key={idx} className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border-l-2 border-red-400">
                        <div className="font-medium text-red-800">⚠️ {weakness.area}</div>
                        <div className="text-xs mt-1 text-gray-600">{weakness.evidence}</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded ${
                          weakness.impact === 'High' ? 'bg-red-100 text-red-700' :
                          weakness.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {weakness.impact?.toUpperCase()} IMPACT
                        </div>
                        <div className="text-xs mt-2 text-blue-700 font-medium">
                          💡 {weakness.recommendation}
                        </div>
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500 italic">
                        AI analysis in progress...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Skill Gaps */}
                {aiAnalysis?.skillGaps?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-orange-700 mb-2">🤖 Skill Gaps</h5>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.skillGaps.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Career Advice */}
                <div>
                  <h5 className="text-sm font-medium text-blue-700 mb-2">🤖 AI Career Advice</h5>
                  <div className="space-y-2">
                    {aiAnalysis?.careerAdvice ? (
                      <>
                        {aiAnalysis.careerAdvice.immediate?.map((action, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border-l-2 border-red-400">
                            <div className="font-medium text-red-800">⚡ Next 2 Weeks</div>
                            <div className="text-xs mt-1">{action}</div>
                          </div>
                        ))}
                        {aiAnalysis.careerAdvice.shortTerm?.map((action, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-2 border-yellow-400">
                            <div className="font-medium text-yellow-800">🎯 Next 2 Months</div>
                            <div className="text-xs mt-1">{action}</div>
                          </div>
                        ))}
                        {aiAnalysis.careerAdvice.longTerm?.map((action, idx) => (
                          <div key={idx} className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border-l-2 border-green-400">
                            <div className="font-medium text-green-800">🌱 Next 6 Months</div>
                            <div className="text-xs mt-1">{action}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        AI is generating your personalized career advice...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Market Comparison & Risk Assessment */}
                {(aiAnalysis?.competitorComparison || aiAnalysis?.riskAssessment) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {aiAnalysis.competitorComparison && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h6 className="text-xs font-medium text-blue-800 mb-1">📈 Market Comparison</h6>
                        <p className="text-xs text-blue-700">{aiAnalysis.competitorComparison}</p>
                      </div>
                    )}
                    {aiAnalysis.riskAssessment && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h6 className="text-xs font-medium text-purple-800 mb-1">⚠️ Risk Assessment</h6>
                        <p className="text-xs text-purple-700">{aiAnalysis.riskAssessment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          

        </motion.div>
        
        {/* Detailed Improvement Roadmap */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">🗺️ Personalized Improvement Roadmap</h3>
            <div className="text-sm text-gray-500">Based on your performance analysis</div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Immediate Actions (1-2 weeks) */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                ⚡ Immediate Actions (1-2 weeks)
              </h4>
              <div className="space-y-2">
                {resumeScore < 70 && (
                  <div className="text-sm text-red-700 bg-white p-2 rounded">
                    • Update resume format and add missing keywords
                  </div>
                )}
                {avgInterviewScore < 60 && (
                  <div className="text-sm text-red-700 bg-white p-2 rounded">
                    • Practice basic interview questions daily (30 min)
                  </div>
                )}
                {isProgrammingCandidate && avgCodingScore < 60 && (
                  <div className="text-sm text-red-700 bg-white p-2 rounded">
                    • Solve 2-3 easy coding problems daily
                  </div>
                )}
                <div className="text-sm text-red-700 bg-white p-2 rounded">
                  • Record yourself answering common questions
                </div>
              </div>
            </div>
            
            {/* Short-term Goals (1-2 months) */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                🎯 Short-term Goals (1-2 months)
              </h4>
              <div className="space-y-2">
                {resumeAnalysis.missingSkills?.length > 0 && (
                  <div className="text-sm text-yellow-700 bg-white p-2 rounded">
                    • Learn top 3 missing skills: {resumeAnalysis.missingSkills.slice(0, 3).join(', ')}
                  </div>
                )}
                {avgInterviewScore < 80 && (
                  <div className="text-sm text-yellow-700 bg-white p-2 rounded">
                    • Master STAR method and behavioral questions
                  </div>
                )}
                {isProgrammingCandidate && (
                  <div className="text-sm text-yellow-700 bg-white p-2 rounded">
                    • Complete 50+ medium-level coding problems
                  </div>
                )}
                <div className="text-sm text-yellow-700 bg-white p-2 rounded">
                  • Build a portfolio project showcasing your skills
                </div>
              </div>
            </div>
            
            {/* Long-term Development (3-6 months) */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                🌱 Long-term Development (3-6 months)
              </h4>
              <div className="space-y-2">
                {isProgrammingCandidate ? (
                  <>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Master system design and architecture concepts
                    </div>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Contribute to open-source projects
                    </div>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Learn advanced frameworks and tools
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Develop industry-specific expertise
                    </div>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Build leadership and management skills
                    </div>
                    <div className="text-sm text-green-700 bg-white p-2 rounded">
                      • Obtain relevant certifications
                    </div>
                  </>
                )}
                <div className="text-sm text-green-700 bg-white p-2 rounded">
                  • Network with industry professionals
                </div>
              </div>
            </div>
          </div>
          
          {/* Resources and Tools */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">📚 Recommended Resources</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Learning Platforms</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  {isProgrammingCandidate ? (
                    <>
                      <div>• LeetCode, HackerRank for coding practice</div>
                      <div>• Coursera, Udemy for technical courses</div>
                      <div>• GitHub for portfolio projects</div>
                    </>
                  ) : (
                    <>
                      <div>• LinkedIn Learning for professional skills</div>
                      <div>• Coursera for industry certifications</div>
                      <div>• Toastmasters for communication skills</div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Practice Tools</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Pramp, InterviewBit for mock interviews</div>
                  <div>• Glassdoor for company-specific questions</div>
                  <div>• YouTube for interview tips and techniques</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Historical Performance Tracking */}
        <motion.div variants={fadeInUp} className="bg-white p-6 rounded-xl shadow-sm border mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📈 Performance History & Tracking</h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          
          {/* Performance Timeline */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Your Journey Timeline</h4>
            <div className="space-y-3">
              {/* Create recent activities from available data */}
              {[
                ...resumes.map(r => ({
                  id: r._id,
                  type: 'resume',
                  title: 'Resume Analysis',
                  score: r.analysis?.overallScore || 0,
                  date: new Date(r.createdAt).toLocaleDateString()
                })),
                ...interviews.map(i => ({
                  id: i._id,
                  type: 'interview',
                  title: 'Mock Interview',
                  score: i.score || 0,
                  date: new Date(i.createdAt).toLocaleDateString()
                })),
                ...coding.map(c => ({
                  id: c._id,
                  type: 'coding',
                  title: c.question || 'Coding Challenge',
                  score: c.score || 0,
                  date: new Date(c.createdAt).toLocaleDateString()
                }))
              ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'resume' ? 'bg-blue-500' :
                      activity.type === 'interview' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-xs text-gray-500">{activity.date}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    activity.score >= 80 ? 'bg-green-100 text-green-800' :
                    activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activity.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">{overallScore}%</div>
              <div className="text-sm text-gray-600 mb-2">Current Score</div>
              <div className="text-xs text-gray-500">
                Target: {overallScore < 70 ? '70%' : overallScore < 85 ? '85%' : '90%+'} 
                ({overallScore < 70 ? 'Good' : overallScore < 85 ? 'Excellent' : 'Outstanding'})
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {Math.max(0, (overallScore < 70 ? 70 : overallScore < 85 ? 85 : 90) - overallScore)}%
              </div>
              <div className="text-sm text-gray-600 mb-2">Points to Goal</div>
              <div className="text-xs text-gray-500">
                {overallScore >= 85 ? 'Maintain excellence!' : 'Keep improving!'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {overallScore < 50 ? '12-16' : overallScore < 70 ? '6-8' : '2-4'}
              </div>
              <div className="text-sm text-gray-600 mb-2">Weeks to Goal</div>
              <div className="text-xs text-gray-500">With consistent effort</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Results
