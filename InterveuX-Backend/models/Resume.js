import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: String,
  filePath: String,
  resumeText: String,
  skills: [String],
  programmingSkills: [String],
  experienceLevel: { type: String, enum: ['junior', 'mid', 'senior'] },
  suitableJobRoles: [String],
  isProgrammingRelated: { type: Boolean, default: false },
  overallScore: Number,
  atsScore: Number,
  skillsMatch: Number,
  readabilityScore: Number,
  strengths: [String],
  weaknesses: [String],
  improvements: [String],
  createdAt: { type: Date, default: Date.now }
});

export const Resume = mongoose.model('Resume', resumeSchema);
