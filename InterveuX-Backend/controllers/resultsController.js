import { generateAIResponse } from '../utils/azureAI.js'

export const generateAIAnalysis = async (req, res) => {
  try {
    const { resumeData, interviewData, codingData, candidateType } = req.body
    
    const prompt = `
Analyze this candidate's performance and provide comprehensive feedback:

RESUME DATA:
- Skills: ${resumeData?.skills?.join(', ') || 'Not provided'}
- Programming Skills: ${resumeData?.programmingSkills?.join(', ') || 'None'}
- Experience Level: ${resumeData?.experience_level || 'Not specified'}
- Overall Resume Score: ${resumeData?.overallScore || 0}%

INTERVIEW DATA:
- Total Interviews: ${interviewData?.length || 0}
- Average Score: ${interviewData?.length > 0 ? Math.round(interviewData.reduce((sum, i) => sum + (i.score || 0), 0) / interviewData.length) : 0}%
- Recent Performance: ${interviewData?.slice(0, 3).map(i => `${i.score || 0}%`).join(', ') || 'None'}

CODING DATA:
- Total Challenges: ${codingData?.length || 0}
- Average Score: ${codingData?.length > 0 ? Math.round(codingData.reduce((sum, c) => sum + (c.score || 0), 0) / codingData.length) : 0}%

CANDIDATE TYPE: ${candidateType}

Provide analysis in this JSON format:
{
  "overallAssessment": "2-3 sentence summary of candidate's readiness",
  "strengths": ["strength1", "strength2", "strength3"],
  "criticalWeaknesses": [
    {
      "area": "weakness area",
      "evidence": "specific evidence",
      "impact": "High|Medium|Low",
      "recommendation": "specific action"
    }
  ],
  "skillGaps": ["skill1", "skill2"],
  "careerAdvice": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "finalVerdict": {
    "decision": "HIRE|STRONG_CONSIDER|MAYBE|REJECT",
    "overallGrade": "A+|A|B+|B|C+|C|D|F",
    "confidence": 85,
    "reasoning": "detailed explanation"
  },
  "performanceBreakdown": {
    "resume": {"score": 85, "grade": "B+", "feedback": "feedback"},
    "interview": {"score": 75, "grade": "B", "feedback": "feedback"},
    "coding": {"score": 80, "grade": "B+", "feedback": "feedback"}
  }
}

Be honest and specific. Focus on actionable insights.`

    const analysis = await generateAIResponse(prompt)
    
    try {
      const parsedAnalysis = JSON.parse(analysis)
      res.json(parsedAnalysis)
    } catch (parseError) {
      // Fallback if AI doesn't return valid JSON
      res.json({
        overallAssessment: analysis.substring(0, 200) + '...',
        strengths: ['Resume uploaded successfully', 'Completed interview process'],
        criticalWeaknesses: [
          {
            area: 'Analysis Error',
            evidence: 'AI response parsing failed',
            impact: 'Low',
            recommendation: 'Manual review recommended'
          }
        ],
        skillGaps: [],
        careerAdvice: {
          immediate: ['Review performance', 'Practice more'],
          shortTerm: ['Improve weak areas', 'Learn new skills'],
          longTerm: ['Build expertise', 'Network professionally']
        },
        finalVerdict: {
          decision: 'MAYBE',
          overallGrade: 'C+',
          confidence: 60,
          reasoning: 'Analysis incomplete due to technical issues'
        }
      })
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    res.status(500).json({
      overallAssessment: 'Analysis temporarily unavailable',
      strengths: ['Participated in interview process'],
      criticalWeaknesses: [],
      skillGaps: [],
      careerAdvice: {
        immediate: ['Continue practicing'],
        shortTerm: ['Improve skills'],
        longTerm: ['Build experience']
      }
    })
  }
}