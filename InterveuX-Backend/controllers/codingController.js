import CodingHistory from '../models/CodingHistory.js'
import { Resume } from '../models/Resume.js'
import { generateCodingQuestions } from '../utils/azureAI.js'
import { executeCode } from '../utils/codeExecutor.js'

// Get personalized coding questions based on resume
export const getRandomQuestions = async (req, res) => {
  try {
    const userId = req.user._id
    
    console.log('🔍 Getting coding questions for user:', userId)
    
    // Get latest resume analysis
    const resume = await Resume.findOne({ userId: userId.toString() }).sort({ createdAt: -1 })
    
    if (!resume) {
      return res.status(404).json({ message: 'Please upload and analyze your resume first to get personalized coding questions' })
    }
    
    console.log('📄 Found resume with skills:', resume.programmingSkills)
    
    // Extract programming skills and experience from resume
    const programmingSkills = resume.programmingSkills || []
    const experienceLevel = resume.experienceLevel || 'junior'
    
    if (programmingSkills.length === 0) {
      // Provide default skills if none found
      const defaultSkills = ['JavaScript', 'Python']
      console.log('⚠️ No programming skills found, using defaults:', defaultSkills)
      try {
        const questions = await generateCodingQuestions(defaultSkills, experienceLevel)
        return res.json(questions)
      } catch (aiError) {
        console.error('❌ AI question generation failed:', aiError)
        return res.status(500).json({ 
          message: 'Azure AI service is currently unavailable. Please try again later.',
          error: aiError.message,
          details: 'Check Azure OpenAI configuration'
        })
      }
    }
    
    console.log('🤖 Generating AI questions for:', { programmingSkills, experienceLevel })
    
    const questions = await generateCodingQuestions(programmingSkills, experienceLevel)
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ message: 'Failed to generate personalized questions. Please try again.' })
    }
    
    console.log('✅ Generated', questions.length, 'personalized coding questions')
    res.json(questions)
  } catch (error) {
    console.error('❌ Error generating coding questions:', error)
    
    // Provide more specific error messages
    if (error.message.includes('Azure AI not configured')) {
      return res.status(500).json({ 
        message: 'Azure AI service is not properly configured',
        error: 'Missing Azure OpenAI credentials',
        details: 'Please check AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT'
      })
    }
    
    if (error.message.includes('Failed to generate coding questions')) {
      return res.status(500).json({ 
        message: 'Azure AI service is currently unavailable',
        error: error.message,
        details: 'The AI service may be experiencing issues. Please try again later.'
      })
    }
    
    res.status(500).json({ 
      message: 'Error generating personalized questions', 
      error: error.message,
      details: 'An unexpected error occurred while processing your request'
    })
  }
}

// Execute and evaluate code with AI analysis
export const executeAndEvaluate = async (req, res) => {
  try {
    const { code, language, testCases, questionTitle } = req.body
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }
    
    console.log('🔧 Executing code:', { language, codeLength: code.length })
    
    let totalTests = 0
    let passedTests = 0
    const results = []
    let simpleOutput = null
    
    // If no test cases, just execute the code
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      const result = await executeCode(code, language)
      simpleOutput = result.output
      
      return res.json({
        output: result.output || 'Code executed successfully',
        error: result.error,
        executionTime: result.executionTime || 0,
        success: true
      })
    }
    
    // Execute with test cases
    for (const testCase of testCases) {
      totalTests++
      try {
        const result = await executeCode(code, language, testCase.input)
        
        let actualOutput = result.output?.toString().trim() || ''
        let expectedOutput = testCase.expected?.toString().trim() || ''
        
        const passed = actualOutput === expectedOutput
        
        if (passed) passedTests++
        
        results.push({
          input: testCase.input,
          expected: expectedOutput,
          actual: actualOutput,
          passed,
          error: result.error,
          executionTime: result.executionTime || 0
        })
      } catch (execError) {
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: '',
          passed: false,
          error: execError.message,
          executionTime: 0
        })
      }
    }
    
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    
    // Generate AI feedback
    const aiFeedback = await generateAICodeFeedback(code, language, score, passedTests, totalTests, questionTitle)
    
    console.log('✅ Execution complete:', { totalTests, passedTests, score })
    
    res.json({
      results,
      score,
      totalTests,
      passedTests,
      aiFeedback,
      success: true
    })
  } catch (error) {
    console.error('❌ Code execution error:', error)
    res.status(500).json({ message: 'Error executing code', error: error.message, success: false })
  }
}

// Save coding round result with AI analysis
export const saveCodingResult = async (req, res) => {
  try {
    const { question, code, language, results, score, totalTests, passedTests, aiFeedback, timeSpent } = req.body
    
    console.log('💾 Attempting to save coding result for user:', req.user?._id)
    console.log('📄 Request body keys:', Object.keys(req.body))
    
    if (!question || !code) {
      return res.status(400).json({ 
        success: false,
        message: 'Question and code are required',
        received: { hasQuestion: !!question, hasCode: !!code }
      })
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated',
        details: 'Please log in to save coding results'
      })
    }

    const coding = await CodingHistory.create({
      userId: req.user._id,
      question: typeof question === 'string' ? question : JSON.stringify(question),
      code,
      language: language || 'javascript',
      results: Array.isArray(results) ? results : [],
      score: Number(score) || 0,
      totalTests: Number(totalTests) || 0,
      passedTests: Number(passedTests) || 0,
      aiFeedback: aiFeedback || null,
      timeSpent: Number(timeSpent) || 0,
      submittedAt: new Date()
    })

    console.log('✅ Successfully saved coding result:', { 
      id: coding._id,
      userId: req.user._id, 
      score: coding.score, 
      totalTests: coding.totalTests, 
      passedTests: coding.passedTests,
      hasFeedback: !!aiFeedback
    })
    
    res.status(201).json({
      success: true,
      message: 'Coding result saved successfully',
      data: {
        id: coding._id,
        score: coding.score,
        totalTests: coding.totalTests,
        passedTests: coding.passedTests,
        submittedAt: coding.submittedAt
      }
    })
  } catch (error) {
    console.error('❌ Error saving coding result:', error)
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid data provided', 
        error: error.message,
        details: Object.keys(error.errors || {})
      })
    }
    
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({ 
        success: false,
        message: 'Database connection error', 
        error: 'Please try again later',
        details: 'MongoDB connection issue'
      })
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error saving coding result', 
      error: error.message,
      details: 'An unexpected error occurred while saving your result'
    })
  }
}

// Get user's coding history with stats
export const getCodingHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const history = await CodingHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to recent 50 submissions
    
    const stats = {
      totalSubmissions: history.length,
      averageScore: history.length > 0 ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length) : 0,
      totalTestsPassed: history.reduce((sum, h) => sum + (h.passedTests || 0), 0),
      totalTests: history.reduce((sum, h) => sum + (h.totalTests || 0), 0),
      successRate: history.length > 0 ? Math.round((history.filter(h => h.score > 0).length / history.length) * 100) : 0
    }
    
    console.log('📊 Fetched coding history:', { userId: req.user._id, submissions: history.length })
    
    res.json({ 
      success: true,
      history, 
      stats 
    })
  } catch (error) {
    console.error('❌ Error fetching coding history:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error fetching coding history', 
      error: error.message 
    })
  }
}

// Get coding stats only
export const getCodingStats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const history = await CodingHistory.find({ userId: req.user._id })
    
    const averageScore = history.length > 0 ? 
      Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length) : 0
    
    res.json({ 
      averageScore,
      totalSubmissions: history.length
    })
  } catch (error) {
    res.status(500).json({ averageScore: 0, totalSubmissions: 0 })
  }
}

// Enhanced code execution with difficulty levels
export const executeEnhancedCode = async (req, res) => {
  try {
    const { code, language, level } = req.body
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }
    
    const result = await executeCode(code, language)
    
    // Generate test cases based on difficulty level
    const testCases = generateTestCases(level)
    let passedTests = 0
    const totalTests = testCases.length
    
    for (const testCase of testCases) {
      try {
        const testResult = await executeCode(code, language, testCase.input)
        if (testResult.output?.toString().trim() === testCase.expected.toString().trim()) {
          passedTests++
        }
      } catch (error) {
        console.log('Test case failed:', error.message)
      }
    }
    
    res.json({
      passed: passedTests === totalTests,
      passedTests,
      totalTests,
      executionTime: result.executionTime || 0,
      error: result.error
    })
  } catch (error) {
    console.error('Enhanced code execution error:', error)
    res.status(500).json({ message: 'Error executing code', error: error.message })
  }
}

// Code review and optimization
export const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body
    
    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }
    
    // Basic code analysis
    const analysis = analyzeCode(code, language)
    
    res.json({
      score: analysis.score,
      suggestions: analysis.suggestions,
      optimizedCode: analysis.optimizedCode
    })
  } catch (error) {
    console.error('Code review error:', error)
    res.status(500).json({ message: 'Error reviewing code', error: error.message })
  }
}

// Test Azure AI connection
export const testAzureConnection = async (req, res) => {
  try {
    console.log('🧪 Testing Azure AI connection...')
    
    const testSkills = ['JavaScript', 'React']
    const testLevel = 'junior'
    
    const questions = await generateCodingQuestions(testSkills, testLevel)
    
    res.json({
      success: true,
      message: 'Azure AI is working correctly',
      questionsGenerated: questions.length,
      sampleQuestion: questions[0] || null
    })
  } catch (error) {
    console.error('❌ Azure AI test failed:', error)
    res.status(500).json({
      success: false,
      message: 'Azure AI connection failed',
      error: error.message
    })
  }
}

// Helper functions
function generateTestCases(level) {
  const testCases = {
    1: [ // Beginner
      { input: [1, 2], expected: 3 },
      { input: [5, 3], expected: 8 }
    ],
    2: [ // Intermediate
      { input: [[1,2,3], 2], expected: [1,3] },
      { input: [[4,5,6], 5], expected: [4,6] }
    ],
    3: [ // Advanced
      { input: ["hello"], expected: "olleh" },
      { input: ["world"], expected: "dlrow" }
    ],
    4: [ // Expert
      { input: [[1,2,3,4]], expected: [[1,2],[3,4]] },
      { input: [[5,6,7,8]], expected: [[5,6],[7,8]] }
    ]
  }
  return testCases[level] || testCases[1]
}

// AI-powered code feedback generation
async function generateAICodeFeedback(code, language, score, passedTests, totalTests, questionTitle) {
  try {
    const { generateAIResponse } = await import('../utils/azureAI.js')
    
    const prompt = `
Analyze this ${language} code solution and provide feedback:

PROBLEM: ${questionTitle || 'Coding Challenge'}
CODE:
${code}

RESULTS:
- Score: ${score}%
- Tests Passed: ${passedTests}/${totalTests}

Provide JSON response:
{
  "overallRating": "Excellent|Good|Fair|Poor",
  "codeQuality": 85,
  "efficiency": 75,
  "readability": 90,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "optimizedCode": "improved version if needed",
  "explanation": "detailed feedback"
}

Focus on:
1. Code efficiency and time complexity
2. Best practices for ${language}
3. Code readability and structure
4. Potential optimizations`

    const aiResponse = await generateAIResponse(prompt)
    
    try {
      return JSON.parse(aiResponse)
    } catch {
      return {
        overallRating: score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor',
        codeQuality: Math.min(100, score + 10),
        efficiency: score,
        readability: Math.min(100, score + 5),
        strengths: score >= 80 ? ['Code works correctly'] : ['Attempted solution'],
        improvements: score < 100 ? ['Review test cases', 'Optimize logic'] : [],
        explanation: `Your solution scored ${score}% with ${passedTests}/${totalTests} tests passing.`
      }
    }
  } catch (error) {
    console.error('AI feedback generation failed:', error)
    return {
      overallRating: score >= 80 ? 'Good' : 'Fair',
      codeQuality: score,
      efficiency: score,
      readability: score,
      strengths: ['Solution submitted'],
      improvements: ['Keep practicing'],
      explanation: `Your solution scored ${score}% with ${passedTests}/${totalTests} tests passing.`
    }
  }
}

function analyzeCode(code, language) {
  const suggestions = []
  let score = 100
  
  if (code.length < 10) {
    suggestions.push({ type: 'warning', message: 'Code seems too short' })
    score -= 10
  }
  
  if (!code.includes('function') && !code.includes('def') && !code.includes('class')) {
    suggestions.push({ type: 'info', message: 'Consider using functions for better code organization' })
    score -= 5
  }
  
  if (language === 'javascript') {
    if (!code.includes('const') && !code.includes('let')) {
      suggestions.push({ type: 'warning', message: 'Use const/let instead of var' })
      score -= 10
    }
  }
  
  return {
    score: Math.max(score, 0),
    suggestions,
    optimizedCode: code
  }
}
