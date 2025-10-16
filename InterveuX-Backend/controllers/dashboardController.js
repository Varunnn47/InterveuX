import ResumeHistory from '../models/ResumeHistory.js'
import InterviewHistory from '../models/InterviewHistory.js'
import CodingHistory from '../models/CodingHistory.js'

export const getDashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' })
    }
    
    const userId = req.user._id
    console.log('📊 Dashboard request for authenticated user:', userId)

    // Fetch only REAL interviews (never practice)
    const [resumes, interviews, coding] = await Promise.all([
      ResumeHistory.find({ userId }).sort({ createdAt: -1 }),
      InterviewHistory.find({ 
        userId,
        $or: [
          { isPractice: false },
          { isPractice: { $exists: false } } // Legacy data without isPractice field
        ]
      }).sort({ createdAt: -1 }),
      CodingHistory.find({ userId }).sort({ createdAt: -1 })
    ])
    
    console.log('✅ REAL interviews found (no practice):', {
      resumes: resumes.length,
      realInterviews: interviews.length,
      coding: coding.length,
      interviewDetails: interviews.map(i => ({ 
        id: i._id, 
        score: i.score, 
        isPractice: i.isPractice,
        date: i.createdAt.toDateString()
      }))
    })

    // Calculate comprehensive statistics
    const totalInterviews = interviews.length
    const totalCodingChallenges = coding.length
    const totalResumes = resumes.length
    
    // Calculate weighted average score with robust validation and clamping
    const sanitizeScore = (v) => {
      const n = Number(v)
      if (!Number.isFinite(n)) return null
      // Clamp to 0-100
      if (n < 0) return 0
      if (n > 100) return 100
      return n
    }

    const validInterviews = interviews
      .map(i => ({ ...i.toObject ? i.toObject() : i, _score: sanitizeScore(i.score) }))
      .filter(i => i._score !== null)

    const validCoding = coding
      .map(c => ({ ...c.toObject ? c.toObject() : c, _score: sanitizeScore(c.score) }))
      .filter(c => c._score !== null)

    const validResumes = resumes
      .map(r => ({ ...r.toObject ? r.toObject() : r, _score: sanitizeScore(r.analysis?.overallScore) }))
      .filter(r => r._score !== null)

    const interviewAvg = validInterviews.length > 0 ? 
      Math.round(validInterviews.reduce((sum, i) => sum + i._score, 0) / validInterviews.length) : 0
    const codingAvg = validCoding.length > 0 ? 
      Math.round(validCoding.reduce((sum, c) => sum + c._score, 0) / validCoding.length) : 0
    const resumeAvg = validResumes.length > 0 ? 
      Math.round(validResumes.reduce((sum, r) => sum + r._score, 0) / validResumes.length) : 0

    // Log any suspicious original scores (non-finite or out-of-range) for debugging
    const suspicious = []
    resumes.forEach(r => {
      const raw = r.analysis?.overallScore
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0 || n > 100) suspicious.push({ id: r._id, raw })
    })
    if (suspicious.length > 0) console.warn('⚠️ Suspicious resume scores found:', suspicious)
    
    // Calculate overall average based on available data
    const scores = []
    if (interviewAvg > 0) scores.push(interviewAvg)
    if (codingAvg > 0) scores.push(codingAvg)
    if (resumeAvg > 0) scores.push(resumeAvg)
    
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const lastActivity = getLastActivity([...resumes, ...interviews, ...coding])
    
    console.log('📈 Calculated averages:', {
      interviewAvg,
      codingAvg,
      resumeAvg,
      overallAvg: averageScore,
      validCounts: { interviews: validInterviews.length, coding: validCoding.length, resumes: validResumes.length }
    })

    // Recent activities (last 10) with proper date formatting
    const allActivities = [
      ...resumes.map(r => ({
        id: r._id,
        type: 'resume',
        title: 'Resume Analysis',
        score: r.analysis?.overallScore || 0,
        date: formatDate(r.createdAt)
      })),
      ...interviews.map(i => ({
        id: i._id,
        type: 'interview',
        title: 'Mock Interview',
        score: i.score || 0,
        date: formatDate(i.createdAt)
      })),
      ...coding.map(c => ({
        id: c._id,
        type: 'coding',
        title: c.question || 'Coding Challenge',
        score: c.score || 0,
        date: formatDate(c.createdAt)
      }))
    ]

    const recentActivities = allActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

    const response = {
      totalInterviews,
      totalCodingChallenges,
      totalResumes,
      averageScore: Math.min(100, Math.max(0, Number(averageScore) || 0)),
      interviewAvg: Math.min(100, Math.max(0, Number(interviewAvg) || 0)),
      codingAvg: Math.min(100, Math.max(0, Number(codingAvg) || 0)),
      resumeAvg: Math.min(100, Math.max(0, Number(resumeAvg) || 0)),
      lastActivity,
      recentActivities,
      resumes,
      interviews,
      coding
    };
    
    console.log('📈 Dashboard stats:', {
      totalInterviews,
      totalCodingChallenges,
      totalResumes,
      averageScore,
      activitiesCount: recentActivities.length
    });
    
    res.json(response)
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message })
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getLastActivity = (activities) => {
  if (activities.length === 0) return 'No activity yet'
  
  const latest = activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  const now = new Date()
  const activityDate = new Date(latest.createdAt)
  const diffTime = Math.abs(now - activityDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  return `${Math.ceil(diffDays / 7)} weeks ago`
}