import mongoose from "mongoose";

const resumeHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeText: { type: String, required: true },
    analysis: { type: Object, required: true }, // AI or keyword-based analysis
  },
  { timestamps: true }
);

export default mongoose.model("ResumeHistory", resumeHistorySchema);
