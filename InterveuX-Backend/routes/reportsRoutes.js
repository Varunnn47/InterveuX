import express from 'express';
import { generatePerformanceReport } from '../controllers/reportsController.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/performance', authMiddleware, generatePerformanceReport);

export default router;