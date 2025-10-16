import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

import User from './models/User.js'
import ResumeHistory from './models/ResumeHistory.js'
import InterviewHistory from './models/InterviewHistory.js'
import CodingHistory from './models/CodingHistory.js'

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB for verification')

    const userCount = await User.countDocuments()
    const resumeHistCount = await ResumeHistory.countDocuments()
    const interviewHistCount = await InterviewHistory.countDocuments()
    const codingHistCount = await CodingHistory.countDocuments()

    console.log('Counts:')
    console.log(`  Users: ${userCount}`)
    console.log(`  ResumeHistory: ${resumeHistCount}`)
    console.log(`  InterviewHistory: ${interviewHistCount}`)
    console.log(`  CodingHistory: ${codingHistCount}`)

    process.exit(0)
  } catch (error) {
    console.error('Error checking database:', error)
    process.exit(1)
  }
}

checkDatabase()
