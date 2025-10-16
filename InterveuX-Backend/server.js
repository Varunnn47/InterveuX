import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";

// Import route files correctly
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import resultsRoutes from "./routes/resultsRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default_jwt_secret_change_in_production';
}

import http from 'http';
import { Server } from 'socket.io';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Cache-Control']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'IntervueX Backend is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoints (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/google', (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
      frontendUrl: process.env.FRONTEND_URL || 'Not set'
    });
  });
  
  // Debug interview data
  app.get('/api/debug/interviews', async (req, res) => {
    try {
      const InterviewHistory = (await import('./models/InterviewHistory.js')).default;
      const allInterviews = await InterviewHistory.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .select('userId score isPractice createdAt responses.length');
      
      const realInterviews = allInterviews.filter(i => i.isPractice !== true);
      const practiceInterviews = allInterviews.filter(i => i.isPractice === true);
      
      res.json({
        summary: {
          totalInterviews: await InterviewHistory.countDocuments(),
          practiceCount: await InterviewHistory.countDocuments({ isPractice: true }),
          realCount: await InterviewHistory.countDocuments({ isPractice: { $ne: true } })
        },
        realInterviews: realInterviews.map(i => ({
          id: i._id,
          userId: i.userId,
          score: i.score,
          isPractice: i.isPractice,
          responseCount: i.responses?.length || 0,
          date: i.createdAt.toDateString()
        })),
        practiceInterviews: practiceInterviews.map(i => ({
          id: i._id,
          userId: i.userId,
          score: i.score,
          isPractice: i.isPractice,
          date: i.createdAt.toDateString()
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes); // Add this for frontend compatibility
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/dashboard", dashboardRoutes); // Add this for frontend compatibility
app.use("/api/results", resultsRoutes);
app.use("/api/reports", reportsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect DB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
  process.exit(1);
});
