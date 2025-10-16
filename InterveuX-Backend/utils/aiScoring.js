// AI Scoring Service for Interview Analysis
export const analyzeInterviewResponse = (response, questionType) => {
  const { question, answer, timeSpent, timeLimit } = response
  
  // Basic scoring metrics
  const scores = {
    technical: 0,
    communication: 0,
    confidence: 0,
    completeness: 0,
    overall: 0
  }
  
  // Analyze answer length and structure
  const wordCount = answer.split(' ').length
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  
  // Communication scoring
  const avgWordsPerSentence = wordCount / Math.max(sentences, 1)
  scores.communication = Math.min(100, Math.max(0, 
    (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25 ? 80 : 60) +
    (sentences >= 3 ? 20 : 0)
  ))
  
  // Confidence scoring (based on filler words and pace)
  const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually']
  const fillerCount = answer.toLowerCase().split(' ').filter(word => 
    fillerWords.includes(word)
  ).length
  
  scores.confidence = Math.max(0, 100 - (fillerCount * 15))
  
  // Completeness scoring (time usage)
  const timeUsageRatio = timeSpent / timeLimit
  scores.completeness = timeUsageRatio >= 0.5 && timeUsageRatio <= 0.9 ? 90 : 
                       timeUsageRatio < 0.3 ? 40 : 70
  
  // Technical scoring (keyword-based for technical questions)
  if (questionType === 'Technical') {
    const technicalKeywords = [
      'function', 'variable', 'scope', 'closure', 'async', 'promise',
      'component', 'state', 'props', 'hook', 'api', 'database',
      'algorithm', 'complexity', 'performance', 'optimization'
    ]
    
    const keywordMatches = technicalKeywords.filter(keyword => 
      answer.toLowerCase().includes(keyword)
    ).length
    
    scores.technical = Math.min(100, keywordMatches * 15)
  } else {
    scores.technical = scores.communication // Use communication score for non-technical
  }
  
  // Overall score calculation
  scores.overall = Math.round(
    (scores.technical * 0.3 + 
     scores.communication * 0.3 + 
     scores.confidence * 0.2 + 
     scores.completeness * 0.2)
  )
  
  return {
    scores,
    feedback: generateFeedback(scores, questionType, { wordCount, sentences, fillerCount, timeUsageRatio }),
    metrics: {
      wordCount,
      sentences,
      fillerCount,
      timeUsageRatio: Math.round(timeUsageRatio * 100)
    }
  }
}

const generateFeedback = (scores, questionType, metrics) => {
  const feedback = []
  
  // Communication feedback
  if (scores.communication < 60) {
    feedback.push("Try to structure your answers with clear sentences and better flow.")
  } else if (scores.communication >= 80) {
    feedback.push("Excellent communication skills demonstrated!")
  }
  
  // Confidence feedback
  if (scores.confidence < 70) {
    feedback.push("Reduce filler words (um, uh, like) to sound more confident.")
  }
  
  // Completeness feedback
  if (metrics.timeUsageRatio < 0.3) {
    feedback.push("Consider providing more detailed answers within the time limit.")
  } else if (metrics.timeUsageRatio > 0.9) {
    feedback.push("Good time management! You used the available time effectively.")
  }
  
  // Technical feedback
  if (questionType === 'Technical' && scores.technical < 60) {
    feedback.push("Include more technical terms and concepts in your technical answers.")
  }
  
  return feedback.length > 0 ? feedback : ["Good overall response!"]
}

export const calculateOverallInterviewScore = (responses) => {
  if (!responses || responses.length === 0) {
    return { score: 0, breakdown: {}, summary: ['No responses to analyze'], detailedFeedback: [] }
  }
  
  let totalScore = 0
  let technicalScore = 0
  let behavioralScore = 0
  let hrScore = 0
  let technicalCount = 0
  let behavioralCount = 0
  let hrCount = 0

  const detailedFeedback = responses.map((response) => {
    const { question, answer, type } = response
    let score = 0
    const answerLength = answer?.length || 0
    const answerText = answer?.toLowerCase() || ''
    const wordCount = answer?.split(' ').filter(w => w.length > 2).length || 0
    
    // Enhanced length scoring (0-35)
    if (wordCount >= 80) score += 35
    else if (wordCount >= 50) score += 30
    else if (wordCount >= 30) score += 25
    else if (wordCount >= 15) score += 18
    else if (wordCount >= 5) score += 10
    
    // STAR method detection (0-25)
    const starWords = ['situation', 'task', 'action', 'result', 'challenge', 'solution', 'outcome']
    const starCount = starWords.filter(word => answerText.includes(word)).length
    if (starCount >= 3) score += 25
    else if (starCount >= 2) score += 18
    else if (starCount >= 1) score += 10
    
    // Specific examples and metrics (0-20)
    const hasExample = answerText.includes('example') || answerText.includes('specifically') || answerText.includes('instance')
    const hasMetrics = /\d+(%|percent|users|projects|years|months)/.test(answerText)
    if (hasExample) score += 12
    if (hasMetrics) score += 8
    
    // Technical depth for technical questions (0-20)
    if (type?.toLowerCase() === 'technical') {
      const techTerms = ['algorithm', 'database', 'api', 'framework', 'architecture', 'performance', 'security', 'testing', 'javascript', 'python', 'react', 'node']
      const techCount = techTerms.filter(term => answerText.includes(term)).length
      score += Math.min(20, techCount * 4)
    }
    
    // Penalize very short answers
    if (wordCount < 10) score = Math.max(0, score - 25)
    
    score = Math.min(100, Math.max(0, score))
    
    switch (type?.toLowerCase()) {
      case 'technical':
        technicalScore += score
        technicalCount++
        break
      case 'behavioral':
        behavioralScore += score
        behavioralCount++
        break
      case 'hr':
        hrScore += score
        hrCount++
        break
      default:
        behavioralScore += score
        behavioralCount++
    }
    
    totalScore += score
    
    return {
      question,
      answer,
      type,
      score,
      wordCount,
      feedback: score >= 85 ? '🌟 Excellent response with great depth!' : 
                score >= 70 ? '👍 Good response, well structured' : 
                score >= 50 ? '⚠️ Average response, needs more detail' : 
                '❌ Response needs significant improvement'
    }
  })

  const overallScore = Math.round(totalScore / responses.length)
  
  const breakdown = {
    technical: technicalCount > 0 ? Math.round(technicalScore / technicalCount) : 0,
    communication: hrCount > 0 ? Math.round(hrScore / hrCount) : Math.round(overallScore * 0.95),
    confidence: behavioralCount > 0 ? Math.round(behavioralScore / behavioralCount) : Math.round(overallScore * 0.90),
    completeness: Math.round((responses.filter(r => (r.answer?.length || 0) > 50).length / responses.length) * 100)
  }

  const summary = [
    overallScore >= 90 ? '🎉 Outstanding interview performance!' : 
    overallScore >= 80 ? '🚀 Strong interview performance' : 
    overallScore >= 70 ? '💪 Good interview performance' : 
    overallScore >= 60 ? '⚠️ Average performance, room for improvement' : 
    '📚 Needs more practice and preparation',
    `Answered ${responses.length} questions with ${overallScore}% overall score`
  ]

  console.log(`🎯 AI Interview Scoring Complete:`, {
    overallScore: `${overallScore}%`,
    responses: responses.length,
    avgWords: Math.round(detailedFeedback.reduce((sum, f) => sum + (f.wordCount || 0), 0) / responses.length),
    breakdown
  })

  return {
    score: overallScore,
    breakdown,
    summary,
    detailedFeedback
  }
}

// Removed - functionality moved to calculateOverallInterviewScore