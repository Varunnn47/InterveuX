import express from 'express';
import { generateAIAnalysis } from '../controllers/resultsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate AI analysis for results
router.post('/ai-analysis', protect, generateAIAnalysis);

export default router;