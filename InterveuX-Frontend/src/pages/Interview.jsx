// src/pages/Interview.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Webcam from 'react-webcam'
import { Mic, Play, SkipForward, ArrowRight, Clock, AlertTriangle, Settings, Bot } from 'lucide-react'
import { fadeInUp, staggerContainer } from '../utils/motion'
import api from '../lib/api'
import InterviewSettings from '../components/InterviewSettings'
import RecordingManager from '../components/RecordingManager'

const Interview = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [userResponse, setUserResponse] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [inputMode, setInputMode] = useState('voice') // 'voice' or 'text'
  const [timeLeft, setTimeLeft] = useState(0)

  const [questionLevel, setQuestionLevel] = useState('beginner')
  const [isRecording, setIsRecording] = useState(false)
  const [analysisData, setAnalysisData] = useState({
    confidence: 0,
    speakingPace: 0,
    fillerWords: 0,
    eyeContact: 0
  })
  const [realTimeFeedback, setRealTimeFeedback] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [interviewSettings, setInterviewSettings] = useState(null)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [aiInterviewer, setAiInterviewer] = useState({ speaking: false, listening: false })
  const [, setFollowUpQuestions] = useState([])
  const [conversationFlow, setConversationFlow] = useState([])
  const webcamRef = useRef(null)
  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunks = useRef([])
  const navigate = useNavigate()

  const questionPools = {
    beginner: [
      { type: 'HR', question: 'Tell me about yourself and why you are interested in this position.', timeLimit: 120 },
      { type: 'Technical', question: 'What is the difference between let, const, and var in JavaScript?', timeLimit: 90 },
      { type: 'Behavioral', question: 'Why do you want to work in this field?', timeLimit: 90 },
      { type: 'HR', question: 'What are your career goals for the next 5 years?', timeLimit: 120 },
      { type: 'Technical', question: 'Explain what is a function in programming and give an example.', timeLimit: 90 },
      { type: 'Behavioral', question: 'Describe a time when you had to learn something new quickly.', timeLimit: 120 }
    ],
    intermediate: [
      { type: 'HR', question: 'What are your greatest strengths and how do they relate to this role?', timeLimit: 120 },
      { type: 'Technical', question: 'Explain closures in JavaScript with an example.', timeLimit: 150 },
      { type: 'Technical', question: 'How would you optimize the performance of a React application?', timeLimit: 180 },
      { type: 'Behavioral', question: 'Describe a challenging project you worked on and how you overcame obstacles.', timeLimit: 180 },
      { type: 'HR', question: 'Why are you leaving your current job?', timeLimit: 120 },
      { type: 'Technical', question: 'What is the difference between SQL and NoSQL databases?', timeLimit: 150 },
      { type: 'Behavioral', question: 'Tell me about a time you disagreed with a team member. How did you handle it?', timeLimit: 150 },
      { type: 'Technical', question: 'Explain RESTful APIs and their principles.', timeLimit: 180 }
    ],
    advanced: [
      { type: 'Technical', question: 'Design a scalable system for handling millions of concurrent users.', timeLimit: 300 },
      { type: 'Technical', question: 'Explain event loop, call stack, and task queue in JavaScript.', timeLimit: 240 },
      { type: 'Behavioral', question: 'How do you handle technical disagreements with senior team members?', timeLimit: 180 },
      { type: 'Technical', question: 'Design a distributed caching system like Redis.', timeLimit: 300 },
      { type: 'Behavioral', question: 'Describe a time when you had to make a difficult technical decision under pressure.', timeLimit: 200 },
      { type: 'Technical', question: 'How would you implement a real-time chat application?', timeLimit: 250 },
      { type: 'HR', question: 'How do you stay updated with the latest technology trends?', timeLimit: 150 },
      { type: 'Technical', question: 'Explain microservices architecture and its trade-offs.', timeLimit: 240 }
    ]
  }

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  useEffect(() => {
    if (interviewStarted) {
      speakQuestion(questions[currentQuestion].question)
      startTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, interviewStarted])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startInterview = async () => {
    setLoadingQuestions(true)
    try {
      const resumeData = JSON.parse(localStorage.getItem('resumeAnalysis') || '{}')
      
      console.log('🔍 Checking resume data for interview:', {
        hasData: !!resumeData,
        hasSkills: !!resumeData.skills,
        skillsCount: resumeData.skills?.length || 0,
        email: resumeData.email,
        isProgramming: resumeData.isProgrammingRelated
      })
      
      if (!resumeData || !resumeData.skills || resumeData.skills.length === 0) {
        alert('Please upload and analyze your resume first to generate personalized questions!')
        navigate('/resume-analyzer')
        return
      }
      
      console.log('🤖 Generating AI questions from resume:', {
        skills: resumeData.skills?.slice(0, 3),
        programmingSkills: resumeData.programmingSkills?.slice(0, 3),
        experience: resumeData.experience_level,
        isProgramming: resumeData.isProgrammingRelated
      })
      
      const response = await api.post('/api/interview/generate-questions', {
        resumeData: {
          skills: resumeData.skills || [],
          programmingSkills: resumeData.programmingSkills || [],
          experience_level: resumeData.experience_level || 'Mid Level',
          suitableJobRoles: resumeData.suitableJobRoles || [],
          isProgrammingRelated: resumeData.isProgrammingRelated || false,
          summary: resumeData.summary || '',
          email: resumeData.email || ''
        },
        difficulty: 'resume-based'
      })
      
      const generatedQuestions = response.data.questions || []
      
      if (generatedQuestions.length === 0) {
        throw new Error('No questions generated')
      }
      
      console.log('✅ AI Generated', generatedQuestions.length, 'personalized questions')
      setQuestions(generatedQuestions.slice(0, 8))
      setInterviewStarted(true)
    } catch (error) {
      console.error('❌ AI question generation failed:', error)
      alert('Unable to generate personalized questions. Please try again or upload a different resume.')
      navigate('/resume-analyzer')
    } finally {
      setLoadingQuestions(false)
    }
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(questions[currentQuestion].timeLimit)
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          nextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-red-600'
    if (timeLeft <= 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      setAiInterviewer(prev => ({ ...prev, speaking: true }))
      
      // Wait for voices to load
      const setVoiceAndSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices()
        
        // Try to find Ravi voice or other pleasant voices
        const preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('ravi') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('hazel') ||
          voice.name.toLowerCase().includes('susan') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('female')
        )
        
        if (preferredVoice) {
          utterance.voice = preferredVoice
          console.log('Using voice:', preferredVoice.name)
        } else {
          console.log('No preferred voice found, available voices:', voices.map(v => v.name))
        }
        
        utterance.rate = 0.75  // Slower, more pleasant pace
        utterance.pitch = 1.2  // Higher pitch for softer tone
        utterance.volume = 0.8 // Gentle volume
        
        utterance.onend = () => setAiInterviewer(prev => ({ ...prev, speaking: false, listening: true }))
        window.speechSynthesis.speak(utterance)
      }
      
      // Check if voices are loaded
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak()
      } else {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak()
        }
      }
    }
  }

  const generateFollowUp = (response) => {
    const followUps = {
      'tell me about yourself': ['What specific skills make you stand out?', 'How do your experiences align with this role?'],
      'javascript': ['Can you give me a practical example?', 'How would you debug this in production?'],
      'project': ['What was the biggest challenge?', 'How did you measure success?'],
      'strength': ['Can you provide a specific example?', 'How has this strength helped in past roles?']
    }
    
    const key = Object.keys(followUps).find(k => response.toLowerCase().includes(k))
    return key ? followUps[key][Math.floor(Math.random() * followUps[key].length)] : null
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.')
      return
    }
    const recognition = new window.webkitSpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let startTime = Date.now()
    let wordCount = 0

    recognition.onstart = () => {
      setIsListening(true)
      setAiInterviewer(prev => ({ ...prev, listening: true, speaking: false }))
      startRecording()
      startTime = Date.now()
    }
    
    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      
      const fullText = finalTranscript || interimTranscript
      setUserResponse(prev => prev + finalTranscript)
      
      // Real-time analysis
      analyzeResponse(fullText, Date.now() - startTime)
    }
    
    recognition.onend = () => {
      setIsListening(false)
      setAiInterviewer(prev => ({ ...prev, listening: false }))
      stopRecording()
      
      // Generate follow-up if response is substantial
      if (userResponse.length > 50) {
        const followUp = generateFollowUp(userResponse)
        if (followUp) {
          setFollowUpQuestions(prev => [...prev, followUp])
          setTimeout(() => {
            speakQuestion(followUp)
            setConversationFlow(prev => [...prev, { type: 'followup', question: followUp, timestamp: Date.now() }])
          }, 2000)
        }
      }
    }
    recognition.onerror = () => {
      setIsListening(false)
      setAiInterviewer(prev => ({ ...prev, listening: false }))
      stopRecording()
    }

    recognition.start()
  }

  const analyzeResponse = (text, duration) => {
    const words = text.split(' ').filter(word => word.length > 0)
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually']
    const fillerCount = words.filter(word => 
      fillerWords.includes(word.toLowerCase())
    ).length
    
    const wpm = duration > 0 ? (words.length / (duration / 60000)) : 0
    const confidence = Math.max(0, Math.min(100, 100 - (fillerCount * 10) + (wpm > 120 ? -10 : 0)))
    
    setAnalysisData({
      confidence: Math.round(confidence),
      speakingPace: Math.round(wpm),
      fillerWords: fillerCount,
      eyeContact: Math.round(Math.random() * 30 + 70) // Simulated
    })
    
    // Real-time feedback
    let feedback = ''
    if (wpm < 100) feedback = 'Speak a bit faster'
    else if (wpm > 180) feedback = 'Slow down your pace'
    else if (fillerCount > 3) feedback = 'Reduce filler words'
    else feedback = 'Good pace and clarity!'
    
    setRealTimeFeedback(feedback)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      recordedChunks.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error starting recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        // Store recording URL for later use
        console.log('Recording saved:', url)
      }
    }
  }

  const nextQuestion = async () => {
    if (!userResponse.trim()) {
      alert('Please provide an answer before moving to the next question.')
      return
    }

    if (timerRef.current) clearInterval(timerRef.current)
    
    const updated = [...transcripts, { question: questions[currentQuestion].question, answer: userResponse }]
    setTranscripts(updated)
    setUserResponse('')

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      try {
        // Check authentication first
        const token = localStorage.getItem('intervuex_token')
        if (!token) {
          alert('Please log in to save your interview')
          navigate('/login')
          return
        }
        
        const totalTime = questions.reduce((sum, q) => sum + q.timeLimit, 0) - timeLeft
        
        const interviewData = {
          responses: updated.map((item, index) => ({
            question: item.question,
            answer: item.answer,
            type: questions[index]?.type || 'Behavioral',
            timeLimit: questions[index]?.timeLimit || 120
          })),
          difficulty: 'intermediate',
          isPractice: false,
          totalTime,
          score: Math.floor(Math.random() * 30) + 70
        }
        
        console.log('💾 Saving interview:', {
          responses: interviewData.responses.length,
          isPractice: interviewData.isPractice,
          difficulty: interviewData.difficulty,
          score: interviewData.score
        })
        
        const response = await api.post('/api/interview/save', interviewData)
        console.log('✅ Interview saved successfully:', {
          id: response.data._id,
          score: response.data.score,
          isPractice: response.data.isPractice
        })
      } catch (err) {
        console.error('❌ Error saving interview:', err)
        if (err.response?.status === 401) {
          alert('Please log in again to save your interview')
          navigate('/login')
          return
        }
        alert('Interview completed but there was an issue saving.')
      }
      navigate('/results')
    }
  }

  const retryQuestion = () => {
    setUserResponse('')
    startTimer()
    speakQuestion(questions[currentQuestion].question)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto"
      >
        {!interviewStarted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <motion.h1 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-heading text-6xl font-bold text-gray-900 mb-6"
            >
              AI Mock Interview
            </motion.h1>
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-body text-gray-600 max-w-3xl mx-auto mb-10 text-xl"
            >
              🤖 AI will generate personalized questions based on your resume. Minimum 8 questions will be asked.
            </motion.p>
            
            <motion.button 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={startInterview} 
              disabled={loadingQuestions}
              className="bg-primary text-white px-10 py-5 rounded-lg disabled:opacity-50 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loadingQuestions ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : null}
              {loadingQuestions ? 'Loading Questions...' : 'Start Interview'}
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div variants={fadeInUp} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-heading text-2xl font-bold text-gray-900">Question {currentQuestion + 1} of {questions.length}</h1>
                  <p className="text-gray-600">{questions[currentQuestion].type} Question</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-2 text-2xl font-bold ${getTimerColor()}`}>
                    <Clock className="w-6 h-6" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                  {timeLeft <= 30 && timeLeft > 0 && (
                    <div className="flex items-center text-yellow-600 text-sm mt-1">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Time running out!
                    </div>
                  )}
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        timeLeft <= 10 ? 'bg-red-500' : timeLeft <= 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(timeLeft / questions[currentQuestion].timeLimit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="h-full flex flex-col">
              {/* Main Video Area */}
              <div className="h-[500px] bg-black rounded-lg overflow-hidden relative mb-6">
                {/* User Camera - Main View */}
                <div className="w-full h-full relative">
                  {interviewSettings?.enableRecording ? (
                    <RecordingManager
                      isRecording={isRecording}
                      onStartRecording={() => setIsRecording(true)}
                      onStopRecording={(blob) => {
                        setIsRecording(false)
                        setRecordedBlob(blob)
                      }}
                      recordedBlob={recordedBlob}
                    />
                  ) : (
                    <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover" mirrored={true} />
                  )}
                </div>
                
                {/* AI Interviewer - Picture in Picture */}
                <div className="absolute top-4 right-4 w-48 h-32 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`relative transition-all duration-300 ${
                      aiInterviewer.speaking ? 'scale-110 animate-pulse' : 
                      aiInterviewer.listening ? 'scale-105' : 'scale-100'
                    }`}>
                      <Bot className="w-12 h-12 text-white" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        aiInterviewer.speaking ? 'bg-green-500 animate-pulse' :
                        aiInterviewer.listening ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 text-white text-xs bg-black bg-opacity-70 px-2 py-1 rounded">
                    AI Interviewer
                  </div>
                </div>
                
                {/* Bottom Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 text-lg font-medium ${
                        timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-yellow-400' : 'text-white'
                      }`}>
                        <Clock className="w-5 h-5" />
                        <span>{formatTime(timeLeft)}</span>
                      </div>
                      {isRecording && (
                        <div className="flex items-center space-x-2 text-red-400">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm">Recording</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-80">Question {currentQuestion + 1} of {questions.length}</div>
                      <div className="text-xs opacity-60">{questions[currentQuestion].type}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Question and Response Area */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Question</h3>
                      <p className="text-gray-800 text-lg leading-relaxed">{questions[currentQuestion].question}</p>
                    </div>
                    
                    {/* Conversation Flow */}
                    {conversationFlow.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Follow-up Questions:</h4>
                        {conversationFlow.slice(-2).map((item, idx) => (
                          <div key={idx} className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg mb-2 border-l-4 border-blue-400">
                            {item.question}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Your Response</h3>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setInputMode('voice')}
                          className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                            inputMode === 'voice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          🎤 Voice
                        </button>
                        <button
                          onClick={() => setInputMode('text')}
                          className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                            inputMode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          ⌨️ Type
                        </button>
                      </div>
                    </div>
                    
                    {inputMode === 'text' ? (
                      <div>
                        <textarea
                          value={userResponse}
                          onChange={(e) => setUserResponse(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          {userResponse.length > 0 && (
                            <span className="text-green-600">✓ Answer typed: {userResponse.length} characters</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-wrap">{userResponse || 'Click "Start Speaking" to begin voice input...'}</p>
                        {userResponse && (
                          <div className="mt-3 text-sm text-green-600 font-medium">
                            ✓ Voice input captured: {userResponse.length} characters
                          </div>
                        )}
                      </div>
                    )}
                    
                    {isListening && realTimeFeedback && (
                      <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 text-sm">
                        💡 {realTimeFeedback}
                      </div>
                    )}
                    
                    <div className="mt-3 text-sm text-gray-600">
                      {inputMode === 'voice' ? (
                        isListening ? '🔴 Recording... Speak clearly into your microphone' : '🎤 Voice input ready'
                      ) : (
                        `${userResponse.length} characters typed`
                      )}
                    </div>
                  </div>
                  

                </div>
                
                {/* Control Panel */}
                <div className="space-y-3">
                  {inputMode === 'voice' ? (
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-all cursor-pointer ${
                        isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
                      }`} onClick={isListening ? () => setIsListening(false) : startListening}>
                        <Mic className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-sm text-gray-700">
                        {isListening ? (
                          <div>
                            <div className="font-medium text-red-600">🔴 Recording...</div>
                            <div className="text-xs mt-1">Click microphone to stop</div>
                          </div>
                        ) : aiInterviewer.speaking ? (
                          <div className="font-medium text-yellow-600">AI is speaking...</div>
                        ) : (
                          <div>
                            <div className="font-medium text-blue-600">Ready to record</div>
                            <div className="text-xs mt-1">Click microphone to start</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-3 rounded-lg text-center text-blue-700 text-sm">
                      ⌨️ Type your answer in the text area above
                    </div>
                  )}
                  

                  
                  <button 
                    onClick={nextQuestion} 
                    disabled={!userResponse.trim()}
                    className="w-full bg-primary text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                    {!userResponse.trim() && <span className="block text-xs mt-1">Please provide an answer first</span>}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setUserResponse('')
                      if (inputMode === 'voice') {
                        setIsListening(false)
                      }
                    }}
                    className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    🗑️ Clear Answer
                  </button>
                  
                  <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">🤖 AI-Generated Questions</div>
                    <div className="text-xs mt-1">Based on your resume analysis</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {showSettings && (
          <InterviewSettings
            onStartInterview={(settings) => {
              setInterviewSettings(settings)
              setQuestionLevel(settings.difficulty)
              setIsPracticeMode(settings.practiceMode)
              setShowSettings(false)
              startInterview()
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </motion.div>
    </div>
  )
}

export default Interview
