import ResumeHistory from '../models/ResumeHistory.js'
import { Resume } from '../models/Resume.js'
import multer from 'multer'
import path from 'path'
import { extractTextFromFile } from '../utils/resumeParser.js'
import { analyzeResumeWithAzureAI, validateResumeContent, validateResumeWithAI } from '../utils/azureAI.js'

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

export const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    console.log('📎 File upload attempt:', {
      name: file.originalname,
      ext: ext,
      mimetype: file.mimetype,
      size: file.size
    })
    
    if (!allowedTypes.includes(ext)) {
      console.log('❌ Invalid file extension:', ext)
      cb(new Error(`Invalid file type. Please upload PDF or DOCX files only. Got: ${ext}`))
      return
    }
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      console.log('❌ Invalid MIME type:', file.mimetype)
      cb(new Error(`Invalid file format. Expected PDF or DOCX. Got: ${file.mimetype}`))
      return
    }
    
    console.log('✅ File type validation passed')
    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

export const analyzeResume = async (req, res) => {
  try {
    const requestId = Date.now() + '-' + Math.floor(Math.random() * 1000)
    console.log(`📎 [${requestId}] Resume upload request received`)
    
    if (!req.file) {
      console.log(`❌ [${requestId}] No file in request`)
      return res.status(400).json({ 
        status: 'invalid',
        message: 'No file uploaded. Please select a resume file.' 
      })
    }

    console.log(`📄 [${requestId}] Processing file:`, {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    })
    
    // Extract text from uploaded file
    let resumeText
    try {
      resumeText = await extractTextFromFile(req.file.path)
      console.log(`✅ [${requestId}] Text extracted:`, resumeText?.length, 'characters')
      
      // Log first 200 characters for debugging (without sensitive info)
      if (resumeText && resumeText.length > 0) {
        const preview = resumeText.substring(0, 200).replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
        console.log(`📝 [${requestId}] Content preview:`, preview)
      }
      
      if (!resumeText || resumeText.trim().length === 0) {
        console.log(`❌ [${requestId}] No text could be extracted from file`)
        return res.status(400).json({
          status: 'invalid',
          message: 'Unable to extract text from the uploaded file. Please ensure your resume contains readable text and try again.'
        })
      }
    } catch (extractError) {
      console.error(`❌ [${requestId}] Text extraction error:`, extractError.message)
      return res.status(400).json({
        status: 'invalid',
        message: 'Failed to process the uploaded file. Please ensure your resume is a valid PDF or DOCX file with readable content.'
      })
    }
    
    // Enhanced resume validation with strict checks
    console.log(`🔍 [${requestId}] Validating resume content...`)
    const validation = validateResumeContent(resumeText, req.file.originalname)
    console.log(`📋 [${requestId}] Validation result:`, validation)
    
    if (validation.status === 'invalid') {
      console.log(`❌ [${requestId}] Resume validation failed:`, validation.message)
      return res.status(400).json({
        status: 'invalid',
        message: validation.message
      })
    }
    
    // Additional AI-based validation to detect fake resumes
    console.log(`🤖 [${requestId}] Running AI-based fake resume detection...`)
    const aiValidation = await validateResumeWithAI(resumeText, req.file.originalname)
    if (aiValidation.status === 'invalid') {
      console.log(`❌ [${requestId}] AI validation failed:`, aiValidation.message)
      return res.status(400).json({
        status: 'invalid',
        message: aiValidation.message
      })
    }
    
    console.log(`✅ [${requestId}] Resume validation passed`)
    
    // Use AI analysis
    console.log(`🤖 [${requestId}] Starting AI analysis for unique content...`)
    const analysis = await analyzeResumeWithAzureAI(resumeText, req.file.originalname)
    console.log(`✅ [${requestId}] Analysis completed:`, {
      email: analysis.email,
      skillsCount: analysis.skills?.length || 0,
      programmingSkillsCount: analysis.programmingSkills?.length || 0,
      overallScore: analysis.overallScore
    })
    
    // Save to database only if validation passed
    try {
      // Sanitize analysis numeric fields before saving
      const sanitizeScore = (v, fallback = 85) => {
        const n = Number(v)
        if (!Number.isFinite(n)) return fallback
        if (n < 0) return 0
        if (n > 100) return 100
        return n
      }

      if (analysis) {
        analysis.overallScore = sanitizeScore(analysis.overallScore, 85)
        analysis.atsScore = sanitizeScore(analysis.atsScore, 80)
        analysis.skillsMatch = sanitizeScore(analysis.skillsMatch, 80)
      }
      const resume = await Resume.create({
        userId: req.user._id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        resumeText,
        ...analysis,
        processedAt: new Date(),
        requestId: requestId
      })

      // Save to history with unique identifier
      await ResumeHistory.create({
        userId: req.user._id,
        resumeText: `${req.file.originalname} (${new Date().toLocaleString()})`,
        analysis: {
          ...analysis,
          overallScore: analysis.overallScore || 85,
          processedAt: new Date().toISOString(),
          requestId: requestId
        }
      })

      console.log(`💾 [${requestId}] Saved to database successfully`)
      res.json({
        status: 'valid',
        ...analysis,
        requestId: requestId,
        processedAt: new Date().toISOString()
      })
    } catch (dbError) {
      console.error(`❌ [${requestId}] Database error:`, dbError)
      res.json({
        status: 'valid',
        ...analysis,
        warning: 'Analysis completed but not saved to history',
        requestId: requestId,
        processedAt: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('❌ Resume analysis error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Please upload a valid resume file with real candidate information.'
    
    if (error.message.includes('File not found')) {
      errorMessage = 'File upload failed. Please try again.'
    } else if (error.message.includes('Invalid file type')) {
      errorMessage = 'Invalid file format. Please upload PDF or DOCX files only.'
    } else if (error.message.includes('File too large')) {
      errorMessage = 'File is too large. Please upload a file smaller than 5MB.'
    } else if (error.message.includes('empty')) {
      errorMessage = 'File appears to be empty. Please upload a complete resume.'
    }
    
    res.status(400).json({ 
      status: 'invalid',
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

// Get latest resume analysis for user
export const getLatestResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
    
    if (!resume) {
      return res.status(404).json({ message: 'No resume found' })
    }
    
    res.json(resume)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume', error: error.message })
  }
}

export const getResumeHistory = async (req, res) => {
  try {
    const history = await ResumeHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20) // Limit to last 20 entries
    
    console.log(`📋 Retrieved ${history.length} history entries for user ${req.user._id}`)
    res.json(history)
  } catch (error) {
    console.error('❌ Get history error:', error)
    res.status(500).json({ message: 'Error fetching resume history', error: error.message })
  }
}
