import express from 'express'
import { analyzeResume, getResumeHistory, getLatestResume, upload } from '../controllers/resumeController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Handle multer errors
const handleUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err.message)
      return res.status(400).json({
        status: 'invalid',
        message: err.message || 'File upload failed'
      })
    }
    console.log('✅ File upload successful')
    next()
  })
}

// Test endpoint to check if basic upload works
router.post('/test-upload', protect, handleUpload, (req, res) => {
  console.log('📋 Test upload - File received:', req.file ? req.file.originalname : 'No file')
  res.json({
    status: 'success',
    message: 'File upload test successful',
    file: req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : null
  })
})

router.post('/analyze', protect, handleUpload, analyzeResume)
router.get('/history', protect, getResumeHistory)
router.get('/latest', protect, getLatestResume)

export default router
