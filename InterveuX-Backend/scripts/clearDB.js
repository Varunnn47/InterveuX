import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Import all models
import User from './models/User.js'
import ResumeHistory from './models/ResumeHistory.js'
import InterviewHistory from './models/InterviewHistory.js'
import CodingHistory from './models/CodingHistory.js'

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Clear all collections
    await User.deleteMany({})
    await ResumeHistory.deleteMany({})
    await InterviewHistory.deleteMany({})
    await CodingHistory.deleteMany({})

    console.log('✅ All data cleared from database')
    console.log('Database is now fresh for testing')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    process.exit(1)
  }
}

clearDatabase()