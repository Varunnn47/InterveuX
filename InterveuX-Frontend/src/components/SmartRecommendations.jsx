import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, BookOpen, Briefcase, Target, ExternalLink } from 'lucide-react'

const SmartRecommendations = ({ data }) => {
  const { resumes = [], interviews = [], coding = [] } = data || {}
  
  const resumeAnalysis = resumes[0]?.analysis || {}
  const resumeScore = resumeAnalysis.overallScore || 0
  const avgInterviewScore = interviews.length ? 
    Math.round(interviews.reduce((s, i) => s + (i.score || 0), 0) / interviews.length) : 0
  const avgCodingScore = coding.length ? 
    Math.round(coding.reduce((s, c) => s + (c.score || 0), 0) / coding.length) : 0

  // Generate personalized learning paths
  const getLearningPaths = () => {
    const paths = []
    
    if (resumeScore < 70) {
      paths.push({
        title: "Resume Optimization Path",
        priority: "High",
        duration: "2-3 weeks",
        steps: [
          "Update resume format and structure",
          "Add relevant keywords for ATS",
          "Quantify achievements with metrics",
          "Optimize for target job roles"
        ],
        resources: [
          { name: "Resume Templates", url: "#", type: "template" },
          { name: "ATS Optimization Guide", url: "#", type: "guide" },
          { name: "Achievement Quantification", url: "#", type: "course" }
        ]
      })
    }

    if (avgInterviewScore < 75) {
      paths.push({
        title: "Interview Mastery Path",
        priority: "High",
        duration: "3-4 weeks",
        steps: [
          "Master STAR method for behavioral questions",
          "Practice common technical questions",
          "Improve communication and confidence",
          "Mock interview sessions"
        ],
        resources: [
          { name: "STAR Method Training", url: "#", type: "course" },
          { name: "Interview Question Bank", url: "#", type: "practice" },
          { name: "Communication Skills", url: "#", type: "course" }
        ]
      })
    }

    if (avgCodingScore < 70 && coding.length > 0) {
      paths.push({
        title: "Coding Excellence Path",
        priority: "Medium",
        duration: "4-6 weeks",
        steps: [
          "Strengthen data structures knowledge",
          "Practice algorithm problems daily",
          "Learn system design basics",
          "Code review and optimization"
        ],
        resources: [
          { name: "LeetCode Premium", url: "#", type: "platform" },
          { name: "System Design Course", url: "#", type: "course" },
          { name: "Code Review Guide", url: "#", type: "guide" }
        ]
      })
    }

    return paths
  }

  // Job role suggestions based on performance
  const getJobSuggestions = () => {
    const overallScore = Math.round((resumeScore + avgInterviewScore + avgCodingScore) / 3)
    const isProgramming = resumeAnalysis.programmingSkills?.length > 0
    
    const suggestions = []
    
    if (isProgramming) {
      if (overallScore >= 80) {
        suggestions.push(
          { role: "Senior Software Engineer", match: "95%", salary: "$120k-160k", companies: ["Google", "Microsoft", "Amazon"] },
          { role: "Tech Lead", match: "90%", salary: "$140k-180k", companies: ["Meta", "Apple", "Netflix"] },
          { role: "Principal Engineer", match: "85%", salary: "$160k-220k", companies: ["Stripe", "Uber", "Airbnb"] }
        )
      } else if (overallScore >= 60) {
        suggestions.push(
          { role: "Software Engineer", match: "90%", salary: "$80k-120k", companies: ["Spotify", "Slack", "Zoom"] },
          { role: "Full Stack Developer", match: "85%", salary: "$70k-110k", companies: ["Shopify", "Square", "Twilio"] },
          { role: "Backend Developer", match: "80%", salary: "$75k-115k", companies: ["GitHub", "GitLab", "Atlassian"] }
        )
      } else {
        suggestions.push(
          { role: "Junior Developer", match: "85%", salary: "$50k-80k", companies: ["Startups", "Mid-size companies"] },
          { role: "Frontend Developer", match: "80%", salary: "$55k-85k", companies: ["Local companies", "Remote startups"] }
        )
      }
    } else {
      if (overallScore >= 80) {
        suggestions.push(
          { role: "Product Manager", match: "90%", salary: "$110k-150k", companies: ["Google", "Microsoft", "Amazon"] },
          { role: "Business Analyst", match: "85%", salary: "$80k-120k", companies: ["McKinsey", "BCG", "Deloitte"] },
          { role: "Project Manager", match: "80%", salary: "$75k-110k", companies: ["Various industries"] }
        )
      } else {
        suggestions.push(
          { role: "Associate Product Manager", match: "85%", salary: "$70k-100k", companies: ["Tech startups"] },
          { role: "Business Coordinator", match: "80%", salary: "$50k-80k", companies: ["Various companies"] }
        )
      }
    }
    
    return suggestions
  }

  // Skill gap analysis
  const getSkillGaps = () => {
    const gaps = []
    
    if (resumeAnalysis.missingSkills?.length > 0) {
      gaps.push({
        category: "Technical Skills",
        skills: resumeAnalysis.missingSkills.slice(0, 5),
        impact: "High",
        timeToLearn: "2-4 weeks each"
      })
    }

    if (avgInterviewScore < 70) {
      gaps.push({
        category: "Soft Skills",
        skills: ["Communication", "Leadership", "Problem Solving", "Teamwork"],
        impact: "High",
        timeToLearn: "1-3 months"
      })
    }

    if (avgCodingScore < 60 && coding.length > 0) {
      gaps.push({
        category: "Programming",
        skills: ["Data Structures", "Algorithms", "System Design", "Code Quality"],
        impact: "Critical",
        timeToLearn: "3-6 months"
      })
    }

    return gaps
  }

  const learningPaths = getLearningPaths()
  const jobSuggestions = getJobSuggestions()
  const skillGaps = getSkillGaps()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <Brain className="w-6 h-6 mr-2 text-purple-500" />
        🤖 Smart Recommendations
      </h2>

      {/* Personalized Learning Paths */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
          Personalized Learning Paths
        </h3>
        
        <div className="space-y-4">
          {learningPaths.map((path, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{path.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      path.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {path.priority} Priority
                    </span>
                    <span>⏱️ {path.duration}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Learning Steps:</h5>
                  <ul className="space-y-1">
                    {path.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Recommended Resources:</h5>
                  <div className="space-y-2">
                    {path.resources.map((resource, resIdx) => (
                      <a key={resIdx} href={resource.url} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {resource.name}
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{resource.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Job Role Suggestions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2 text-green-500" />
          Job Role Suggestions
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobSuggestions.map((job, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{job.role}</h4>
                <span className="text-sm font-medium text-green-600">{job.match}</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div>💰 {job.salary}</div>
                <div>🏢 {job.companies.join(", ")}</div>
              </div>
              
              <button className="mt-3 w-full bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 transition-colors text-sm">
                View Similar Jobs
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skill Gap Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-red-500" />
          Skill Gap Analysis
        </h3>
        
        <div className="space-y-4">
          {skillGaps.map((gap, idx) => (
            <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{gap.category}</h4>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    gap.impact === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {gap.impact} Impact
                  </span>
                  <span className="text-gray-500">⏱️ {gap.timeToLearn}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {gap.skills.map((skill, skillIdx) => (
                  <span key={skillIdx} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default SmartRecommendations