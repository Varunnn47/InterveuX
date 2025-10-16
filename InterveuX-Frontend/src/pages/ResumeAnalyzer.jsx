// src/pages/ResumeAnalyzer.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, CheckCircle, Brain, ArrowRight, Code, MessageCircle } from 'lucide-react'
import { fadeInUp, staggerContainer } from '../utils/motion'
import api from '../lib/api'

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          setError('File is too large. Please upload a file smaller than 5MB.')
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          setError('Invalid file type. Please upload only PDF or DOCX files.')
        } else {
          setError('File upload failed. Please try again with a valid resume file.')
        }
        return
      }
      
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        console.log('📁 New file selected:', file.name, 'Size:', file.size)
        
        // Additional client-side validation
        if (file.size < 1024) { // Less than 1KB is likely empty
          setError('File appears to be empty. Please upload a valid resume.')
          return
        }
        
        setFile(file)
        setAnalysis(null) // Clear previous analysis
        setError('')
        // Clear localStorage to prevent showing old analysis
        localStorage.removeItem('resumeAnalysis')
      }
    }
  })

  useEffect(() => {
    // fetch history for current user
    (async () => {
      try {
        const res = await api.get('/api/resume/history')
        if (res?.data) setHistory(res.data)
      } catch (err) {
        // ignore silently; history will be empty
      }
    })()
  }, [])

  const analyzeResume = async () => {
    if (!file) return
    setAnalyzing(true)
    setError('')

    // Clear any previous analysis to ensure fresh results
    setAnalysis(null)
    localStorage.removeItem('resumeAnalysis')

    const formData = new FormData()
    formData.append('resume', file)
    
    // Add timestamp to ensure unique requests
    formData.append('timestamp', Date.now().toString())
    formData.append('fileSize', file.size.toString())

    try {
      console.log('🚀 Starting analysis for:', file.name, 'Size:', file.size)
      
      // Increase timeout for AI analysis since the backend may take longer than the default 10s
      const res = await api.post('/api/resume/analyze', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Cache-Control': 'no-cache',
          'X-Request-ID': `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        timeout: 60000 // 60 seconds for long-running AI analysis
      })
      
      console.log('✅ Analysis response received:', {
        email: res.data.email,
        requestId: res.data.requestId,
        processedAt: res.data.processedAt,
        skillsCount: res.data.skills?.length || 0
      })
      
      if (res.data.status === 'invalid') {
        setError('Please upload a valid resume file with real candidate information.')
        return
      }
      
      // Ensure we have unique analysis data
      const analysisData = {
        ...res.data,
        analyzedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size
      }
      
      setAnalysis(analysisData)
      
      // Save analysis to localStorage for interview use
      localStorage.setItem('resumeAnalysis', JSON.stringify(analysisData))
      console.log('✅ Unique resume analysis saved:', {
        email: analysisData.email,
        fileName: analysisData.fileName,
        requestId: analysisData.requestId,
        skills: analysisData.skills?.length || 0,
        programmingSkills: analysisData.programmingSkills?.length || 0,
        isProgramming: analysisData.isProgrammingRelated
      })
      
      // Refresh history
      const hist = await api.get('/api/resume/history')
      if (hist?.data) setHistory(hist.data)
    } catch (err) {
      console.error('❌ Analysis error:', err)
      
      // Provide more specific error messages, including timeout handling
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 400) {
        setError('Invalid file format. Please upload a PDF or DOCX resume file.')
      } else if (err.response?.status === 413) {
        setError('File too large. Please upload a file smaller than 5MB.')
      } else if (err.code === 'ECONNABORTED' || (err.message || '').toLowerCase().includes('timeout')) {
        setError('Analysis is taking longer than expected. The server may be busy — please try again in a moment.')
      } else if (err.message?.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError('Upload failed. Please ensure you have uploaded a valid resume file with your professional information.')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const startInterview = () => navigate('/interview')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            AI Resume Analyzer
          </h1>
          <p className="font-body text-gray-600 max-w-2xl mx-auto">
            Upload your resume and get detailed AI-powered feedback to improve your chances of landing your dream job
          </p>
          <p className="text-sm text-blue-600 mt-2">
            ✨ Each analysis is unique and personalized to your specific resume content
          </p>
        </motion.div>

        {!analysis ? (
          <>
            <motion.div variants={fadeInUp} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : file 
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <input {...getInputProps()} />
                
                {file ? (
                  <div className="space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">File Ready for Analysis</h3>
                      <p className="text-gray-600">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {isDragActive ? 'Drop your resume here' : 'Upload Your Resume'}
                      </h3>
                      <p className="text-gray-600">
                        Drag and drop your resume, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports PDF and DOCX files (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              {file && (
                <div className="mt-6 space-y-4">
                  <div className="text-center text-sm text-gray-600">
                    Ready to analyze: <span className="font-medium">{file.name}</span>
                    <br />
                    <span className="text-xs">Each analysis is unique and personalized</span>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={analyzeResume}
                      disabled={analyzing}
                      className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {analyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Analyzing {file.name}...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5" />
                          <span>Analyze Resume</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Resume Analysis Complete</h2>
                {analysis.requestId && (
                  <p className="text-xs text-gray-500">Analysis ID: {analysis.requestId}</p>
                )}
              </div>
              
              {/* File Info & Email */}
              <div className="mb-6 text-center space-y-2">
                {analysis.fileName && (
                  <div className="text-sm text-gray-600">
                    📄 File: {analysis.fileName} 
                    {analysis.processedAt && (
                      <span className="ml-2 text-xs">
                        (Processed: {new Date(analysis.processedAt).toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {analysis.email && (
                  <div>
                    <span className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium">
                      📧 {analysis.email}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Scores */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.overallScore || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.atsScore || 'N/A'}</div>
                  <div className="text-sm text-gray-600">ATS Score</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analysis.skillsMatch || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Skills Match</div>
                </div>
              </div>

              {/* Job Roles */}
              {analysis.suitableJobRoles?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Suitable Job Roles:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suitableJobRoles.map((role, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skills */}
              {analysis.skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Skills Found:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Programming Skills */}
              {analysis.programmingSkills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Programming Skills:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.programmingSkills.map((skill, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Experience Level */}
              {analysis.experience_level && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Experience Level:</h3>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full capitalize">
                    {analysis.experience_level}
                  </span>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-700">Strengths:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="text-green-600">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.weaknesses?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-red-700">Areas for Improvement:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-red-600">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {analysis.improvements?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.improvements.map((improvement, i) => (
                      <li key={i} className="text-blue-600">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Skills */}
              {analysis.missingSkills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-orange-700">Skills to Add for Better Job Matches:</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills.map((skill, i) => (
                      <span key={i} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm border border-orange-200">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                {analysis.programmingSkills?.length > 0 ? (
                  <button
                    onClick={() => navigate('/coding-round')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Code className="h-5 w-5" />
                    <span>Start Coding Round</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/interview')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Start Interview</span>
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* Resume History */}
        {history.length > 0 && (
          <motion.div variants={fadeInUp} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">Your Resume History</h2>
            <ul className="space-y-4">
              {history.map((item, index) => (
                <li key={item._id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-700 font-medium">{item.resumeText}</p>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>Overall Score: {item.analysis?.overallScore || 'N/A'}%</span>
                        {item.analysis?.processedAt && (
                          <span>Processed: {new Date(item.analysis.processedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default ResumeAnalyzer
