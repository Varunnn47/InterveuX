import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  getRandomQuestions, 
  executeAndEvaluate, 
  saveCodingResult, 
  getCodingHistory,
  getCodingStats,
  testAzureConnection 
} from '../controllers/codingController.js';

const router = express.Router();

// Get AI-generated questions based on resume
router.get("/questions", protect, getRandomQuestions);

// Execute and evaluate code with test cases
router.post("/execute", protect, executeAndEvaluate);

// Save coding round result
router.post("/save", protect, saveCodingResult);

// Get coding history with stats
router.get("/history", protect, getCodingHistory);

// Get coding stats only
router.get("/stats", protect, getCodingStats);

// Test Azure AI connection
router.get("/test-azure", protect, testAzureConnection);

export default router;
