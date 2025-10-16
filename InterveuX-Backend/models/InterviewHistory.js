import mongoose from "mongoose";

const interviewHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    responses: [{
      question: { type: String, required: true },
      answer: { type: String, required: true },
      type: { type: String, enum: ['HR', 'Technical', 'Behavioral'] },
      timeSpent: { type: Number }, // seconds
      timeLimit: { type: Number } // seconds
    }],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'resume-based'], default: 'intermediate' },
    isPractice: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    totalTime: { type: Number }, // total interview time in seconds
    aiAnalysis: {
      breakdown: {
        technical: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        completeness: { type: Number, default: 0 },
        overall: { type: Number, default: 0 }
      },
      individualAnalysis: [{
        scores: {
          technical: Number,
          communication: Number,
          confidence: Number,
          completeness: Number,
          overall: Number
        },
        feedback: [String],
        metrics: {
          wordCount: Number,
          sentences: Number,
          fillerCount: Number,
          timeUsageRatio: Number
        }
      }],
      summary: [String]
    },
    // Backward compatibility
    questions: [{ type: String }],
    answers: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("InterviewHistory", interviewHistorySchema);
