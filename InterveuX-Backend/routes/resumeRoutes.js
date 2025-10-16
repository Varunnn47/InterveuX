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

router.post('/analyze', protect, handleUpload, analyzeResume)
router.get('/history', protect, getResumeHistory)
router.get('/latest', protect, getLatestResume)

export default router
