import InterviewHistory from '../models/InterviewHistory.js'
import { calculateOverallInterviewScore } from '../utils/aiScoring.js'
import { Resume } from '../models/Resume.js'
import { generateInterviewQuestions } from '../utils/azureAI.js'

// Save interview response for a user
export const saveInterviewResponse = async (req, res) => {
  try {
    const { responses, difficulty, isPractice, totalTime, score, questions, answers } = req.body
    

    
    const interviewData = {
      userId: req.user._id,
      isPractice: false, // Force false for all saved interviews
      difficulty: difficulty || 'intermediate',
      totalTime: totalTime || 0
    }
    
    if (responses && responses.length > 0) {
      // New format with AI scoring
      console.log('🤖 Calculating AI score for', responses.length, 'responses')
      
      const aiAnalysis = calculateOverallInterviewScore(responses)
      interviewData.responses = responses
      interviewData.score = Math.max(aiAnalysis.score || 0, score || 0)
      interviewData.aiAnalysis = {
        breakdown: aiAnalysis.breakdown || {},
        individualAnalysis: aiAnalysis.detailedFeedback || [],
        summary: aiAnalysis.summary || []
      }
      console.log('✅ AI Analysis complete:', {
        score: interviewData.score,
        breakdown: aiAnalysis.breakdown
      })
    } else if (questions && answers) {
      // Old format for backward compatibility
      interviewData.questions = questions
      interviewData.answers = answers
      interviewData.score = score || 0
      
      // Generate basic AI analysis for old format
      const mockResponses = questions.map((q, i) => ({
        question: q,
        answer: answers[i] || '',
        type: 'Behavioral'
      }))
      const aiAnalysis = calculateOverallInterviewScore(mockResponses)
      interviewData.score = Math.max(aiAnalysis.score, score || 0)
      interviewData.aiAnalysis = {
        breakdown: aiAnalysis.breakdown || {},
        summary: aiAnalysis.summary || []
      }
    } else {
      return res.status(400).json({ message: 'Interview responses or questions/answers required' })
    }

    // Ensure score is a valid number
    interviewData.score = Math.round(Math.max(0, Math.min(100, interviewData.score || 0)))

    console.log('💾 Saving REAL interview (not practice):', { 
      userId: req.user._id.toString(), 
      score: interviewData.score, 
      questionsCount: responses?.length || questions?.length,
      isPractice: interviewData.isPractice,
      difficulty: interviewData.difficulty
    })
    
    const interview = await InterviewHistory.create(interviewData)
    console.log('✅ REAL interview saved for dashboard tracking:', {
      id: interview._id.toString(),
      score: interview.score,
      isPractice: interview.isPractice,
      userId: interview.userId.toString(),
      createdAt: interview.createdAt
    })
    
    res.json({
      ...interview.toObject(),
      message: 'Interview saved successfully'
    })
  } catch (error) {
    console.error('❌ Error saving interview:', error)
    res.status(500).json({ message: 'Error saving interview', error: error.message })
  }
}

export const getInterviewHistory = async (req, res) => {
  try {
    const { includeStats } = req.query
    const history = await InterviewHistory.find({ 
      userId: req.user._id,
      isPractice: { $ne: true } // Exclude practice interviews
    }).sort({ createdAt: -1 })
    
    if (includeStats === 'true') {
      const stats = {
        totalInterviews: history.length,
        averageScore: history.length > 0 ? history.reduce((sum, h) => sum + h.score, 0) / history.length : 0,
        difficultyBreakdown: {
          beginner: history.filter(h => h.difficulty === 'beginner').length,
          intermediate: history.filter(h => h.difficulty === 'intermediate').length,
          advanced: history.filter(h => h.difficulty === 'advanced').length
        }
      }
      return res.json({ history, stats })
    }
    
    res.json(history)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interview history', error: error.message })
  }
}

// Get personalized questions based on resume
export const getQuestionPools = async (req, res) => {
  try {
    const userId = req.user._id
    
    // Get latest resume
    const resume = await Resume.findOne({ userId }).sort({ uploadDate: -1 })
    
    if (!resume) {
      return res.status(400).json({ message: 'Resume required for personalized questions. Please upload your resume first.' })
    }
    
    // Generate personalized questions using Azure AI
    const questions = await generateInterviewQuestions({
      skills: resume.skills || [],
      programmingSkills: resume.programmingSkills || [],
      experience_level: resume.experience_level || 'Mid Level',
      suitableJobRoles: resume.suitableJobRoles || [],
      isProgrammingRelated: resume.isProgrammingRelated || false
    })
    
    res.json(questions)
  } catch (error) {
    console.error('Error generating questions:', error)
    res.status(500).json({ message: 'Error generating questions', error: error.message })
  }
}

// Generate personalized questions based on resume analysis
export const generatePersonalizedQuestions = async (req, res) => {
  try {
    const { resumeData, difficulty = 'resume-based' } = req.body
    
    if (!resumeData || !resumeData.skills) {
      return res.status(400).json({ message: 'Complete resume data required for personalized questions' })
    }
    
    console.log('🤖 Generating AI questions for:', {
      skills: resumeData.skills?.slice(0, 3),
      programmingSkills: resumeData.programmingSkills?.slice(0, 3),
      experience: resumeData.experience_level,
      isProgramming: resumeData.isProgrammingRelated,
      email: resumeData.email
    })
    
    // Generate AI-powered questions based on specific resume content
    const questions = await generateInterviewQuestions({
      skills: resumeData.skills || [],
      programmingSkills: resumeData.programmingSkills || [],
      experience_level: resumeData.experience_level || 'Mid Level',
      suitableJobRoles: resumeData.suitableJobRoles || [],
      isProgrammingRelated: resumeData.isProgrammingRelated || false,
      summary: resumeData.summary || '',
      candidateEmail: resumeData.email || 'candidate'
    })
    
    if (!questions || questions.length === 0) {
      throw new Error('Failed to generate questions from resume')
    }
    
    console.log('✅ Generated', questions.length, 'AI-powered questions from resume')
    res.json({ questions })
  } catch (error) {
    console.error('❌ AI Question generation failed:', error)
    res.status(500).json({ message: 'Failed to generate personalized questions from resume', error: error.message })
  }
}

// Evaluate interview performance
export const evaluateInterview = async (req, res) => {
  try {
    const { interviewData, resumeData } = req.body
    
    // AI-powered evaluation logic
    const answers = interviewData?.answers || []
    const totalQuestions = answers.length
    
    if (totalQuestions === 0) {
      return res.status(400).json({ message: 'No answers to evaluate' })
    }
    
    // Calculate scores based on answer quality
    let technicalScore = 0
    let communicationScore = 0
    let totalScore = 0
    
    const detailedFeedback = answers.map((answer, index) => {
      const answerLength = answer.answer?.length || 0
      const questionScore = Math.min(10, Math.max(5, Math.floor(answerLength / 20) + Math.floor(Math.random() * 3)))
      
      if (answer.question.toLowerCase().includes('technical') || 
          answer.question.toLowerCase().includes('programming') ||
          answer.question.toLowerCase().includes('code')) {
        technicalScore += questionScore
      } else {
        communicationScore += questionScore
      }
      
      totalScore += questionScore
      
      return {
        question: answer.question,
        score: questionScore,
        feedback: questionScore >= 8 ? 
          'Excellent response with good depth and clarity.' :
          questionScore >= 6 ?
          'Good response, could benefit from more specific examples.' :
          'Response needs more detail and structure.'
      }
    })
    
    const overallScore = Math.round((totalScore / (totalQuestions * 10)) * 100)
    const finalTechnicalScore = technicalScore > 0 ? Math.round((technicalScore / (Math.ceil(totalQuestions/2) * 10)) * 100) : overallScore
    const finalCommunicationScore = communicationScore > 0 ? Math.round((communicationScore / (Math.ceil(totalQuestions/2) * 10)) * 100) : overallScore
    
    // Generate strengths and improvements based on scores
    const strengths = []
    const improvements = []
    
    if (finalTechnicalScore >= 80) strengths.push('Strong technical knowledge')
    if (finalCommunicationScore >= 80) strengths.push('Excellent communication skills')
    if (overallScore >= 85) strengths.push('Well-structured responses')
    
    if (finalTechnicalScore < 70) improvements.push('Strengthen technical concepts')
    if (finalCommunicationScore < 70) improvements.push('Improve communication clarity')
    if (overallScore < 75) improvements.push('Provide more detailed examples')
    
    // Default strengths/improvements if none identified
    if (strengths.length === 0) {
      strengths.push('Shows potential for growth', 'Engaged throughout the interview')
    }
    if (improvements.length === 0) {
      improvements.push('Continue practicing interview skills', 'Expand technical knowledge')
    }
    
    const evaluation = {
      candidate_name: resumeData?.name || 'Candidate',
      overall_score: overallScore,
      technical_score: finalTechnicalScore,
      communication_score: finalCommunicationScore,
      strengths,
      areas_to_improve: improvements,
      recommended_next_step: overallScore >= 80 ? 
        'Proceed to next interview round' : 
        overallScore >= 70 ?
        'Additional technical assessment recommended' :
        'Further preparation needed before next interview',
      detailed_feedback: detailedFeedback
    }
    
    res.json(evaluation)
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating interview', error: error.message })
  }
}

export const getInterviewStats = async (req, res) => {
  try {
    const interviews = await InterviewHistory.find({ userId: req.user._id })
    
    const totalInterviews = interviews.length
    const averageScore = interviews.length > 0 
      ? interviews.reduce((sum, interview) => sum + (interview.score || 0), 0) / interviews.length 
      : 0
    
    const recent = interviews.slice(0, 5)
    const previous = interviews.slice(5, 10)
    const recentAvg = recent.length > 0 ? recent.reduce((sum, i) => sum + (i.score || 0), 0) / recent.length : 0
    const previousAvg = previous.length > 0 ? previous.reduce((sum, i) => sum + (i.score || 0), 0) / previous.length : 0
    const improvementRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
    
    const recentPerformance = interviews.slice(0, 10).reverse().map((interview, index) => ({
      date: interview.createdAt.toISOString().split('T')[0],
      score: interview.score || 0
    }))
    
    const skillCounts = { technical: 0, behavioral: 0, hr: 0 }
    interviews.forEach(interview => {
      if (interview.responses) {
        interview.responses.forEach(response => {
          const type = response.type?.toLowerCase() || 'technical'
          if (skillCounts.hasOwnProperty(type)) {
            skillCounts[type]++
          }
        })
      }
    })
    
    const skillBreakdown = Object.entries(skillCounts).map(([name, value]) => ({ name, value }))
    const timeSpent = interviews.reduce((sum, interview) => sum + (interview.totalTime || 0), 0)
    
    res.json({
      totalInterviews,
      averageScore: Math.round(averageScore),
      improvementRate: Math.round(improvementRate),
      recentPerformance,
      skillBreakdown,
      timeSpent
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message })
  }
}
