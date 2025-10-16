import express from "express";
import { saveInterviewResponse, getInterviewHistory, getQuestionPools, getInterviewStats, generatePersonalizedQuestions, evaluateInterview } from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import InterviewHistory from "../models/InterviewHistory.js";

const router = express.Router();

// Save interview results (protected route)
router.post("/save", protect, saveInterviewResponse);

// Get user interview history (protected route)
router.get("/history", protect, getInterviewHistory);

// Get question pools
router.get("/questions", getQuestionPools);

// Generate personalized questions
router.post("/generate-questions", generatePersonalizedQuestions);

// Evaluate interview performance
router.post("/evaluate", evaluateInterview);

// Get interview statistics
router.get("/stats", protect, getInterviewStats);

// Backward compatibility - Save interview results
router.post("/", async (req, res) => {
  try {
    const { userId, responses, score } = req.body;
    const history = new InterviewHistory({ userId, responses, score });
    await history.save();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
