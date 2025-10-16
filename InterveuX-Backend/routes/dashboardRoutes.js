import express from 'express'
import { getDashboardData } from '../controllers/dashboardController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getDashboardData)
router.get('/:userId', protect, getDashboardData)

export default router