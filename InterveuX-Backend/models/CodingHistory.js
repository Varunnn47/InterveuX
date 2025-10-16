import mongoose from "mongoose";

const codingHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, default: "javascript" },
    results: [{
      input: String,
      expected: String,
      actual: String,
      passed: Boolean,
      error: String,
      executionTime: Number
    }],
    score: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    passedTests: { type: Number, default: 0 },
    aiFeedback: { type: Object, default: null },
    timeSpent: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("CodingHistory", codingHistorySchema);
