import { OpenAI } from 'openai'

// Azure AI Foundry client setup - initialize only when needed
let azureAI = null

const getAzureAI = () => {
  if (!azureAI) {
    console.log('🔧 Checking Azure AI configuration...')
    console.log('API Key exists:', !!process.env.AZURE_OPENAI_API_KEY)
    console.log('Endpoint exists:', !!process.env.AZURE_OPENAI_ENDPOINT)
    console.log('Deployment name:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME)
    
    if (!process.env.AZURE_OPENAI_API_KEY) {
      console.log('❌ AZURE_OPENAI_API_KEY not found')
      return null
    }
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      console.log('❌ AZURE_OPENAI_ENDPOINT not found')
      return null
    }
    
    console.log('✅ Initializing Azure AI with endpoint:', process.env.AZURE_OPENAI_ENDPOINT)
    
    try {
      // Ensure endpoint is properly formatted
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT.trim().endsWith('/') 
        ? process.env.AZURE_OPENAI_ENDPOINT.trim().slice(0, -1) 
        : process.env.AZURE_OPENAI_ENDPOINT.trim()
      
      const baseURL = `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'}`
      console.log('🔗 Base URL:', baseURL)
      
      azureAI = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: baseURL,
        defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
        defaultHeaders: {
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
      })
      
      console.log('✅ Azure AI client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Azure AI client:', error)
      return null
    }
  }
  return azureAI
}

// Enhanced resume validation function - detects fake resumes and validates required sections
export const validateResumeContent = (resumeText, fileName) => {
  // Check file extension
  const allowedExtensions = ['.pdf', '.docx']
  const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(fileExt)) {
    return {
      status: 'invalid',
      message: 'Please upload PDF or DOCX format only.'
    }
  }

  // Check if file has content
  if (!resumeText || resumeText.trim().length < 50) {
    return {
      status: 'invalid', 
      message: 'File appears empty or corrupted. Please upload a valid resume with complete information.'
    }
  }

  const textLower = resumeText.toLowerCase()
  const totalWords = resumeText.trim().split(/\s+/).length
  
  // Minimum word count for a valid resume (more lenient)
  if (totalWords < 20) {
    return {
      status: 'invalid',
      message: 'Resume is too short. Please upload a complete resume with detailed information.'
    }
  }
  
  // Detect company profiles
  const companyIndicators = [
    'company profile', 'about us', 'our company', 'our services', 'we provide',
    'we are a', 'leading company', 'our team consists', 'contact information',
    'our mission', 'company overview', 'business profile', 'established in',
    'founded in', 'headquarters', 'branches', 'clients include'
  ]
  
  const companyMatches = companyIndicators.filter(indicator => 
    textLower.includes(indicator)
  ).length
  
  if (companyMatches >= 2) {
    return {
      status: 'invalid',
      message: 'This appears to be a company profile, not a personal resume. Please upload your personal resume.'
    }
  }
  
  // Detect job descriptions/postings - more comprehensive
  const jobPostingIndicators = [
    'job opening', 'we are looking for', 'job description', 'requirements:',
    'responsibilities:', 'qualifications:', 'benefits:', 'apply now',
    'send your resume', 'job posting', 'position available', 'hiring for',
    'job vacancy', 'career opportunity', 'join our team', 'we offer',
    'job summary', 'role description', 'position summary', 'job details',
    'what you will do', 'what we expect', 'ideal candidate', 'must have',
    'preferred qualifications', 'job requirements', 'role requirements',
    'we are seeking', 'role summary', 'company values', 'about the product',
    'successful applicants', 'the candidate will', 'health insurance',
    'stock options', 'learning stipend', 'remote-first policy'
  ]
  
  const jobMatches = jobPostingIndicators.filter(indicator => 
    textLower.includes(indicator)
  ).length
  
  // Enhanced job description patterns
  const jdPatterns = [
    /job title:/i,
    /department:/i,
    /reports to:/i,
    /salary range:/i,
    /employment type:/i,
    /we are seeking/i,
    /the successful candidate/i,
    /role summary/i,
    /company values/i,
    /about the product/i,
    /our product delivers/i,
    /the engineering team/i,
    /required skills:/i,
    /for inquiries, contact/i
  ]
  
  const jdPatternMatches = jdPatterns.filter(pattern => pattern.test(resumeText)).length
  
  if (jobMatches >= 1 || jdPatternMatches >= 1) {
    return {
      status: 'invalid',
      message: 'This appears to be a job description/posting, not a personal resume. Please upload your personal resume.'
    }
  }
  
  // Detect academic papers, notes, or other non-resume documents
  const nonResumeIndicators = [
    'abstract:', 'introduction:', 'methodology:', 'conclusion:', 'references:',
    'bibliography', 'chapter', 'table of contents', 'appendix', 'figure',
    'lecture notes', 'study material', 'assignment', 'homework', 'exam',
    'research paper', 'thesis', 'dissertation', 'journal', 'publication'
  ]
  
  const nonResumeMatches = nonResumeIndicators.filter(indicator => 
    textLower.includes(indicator)
  ).length
  
  if (nonResumeMatches >= 2) {
    return {
      status: 'invalid',
      message: 'This appears to be an academic document or notes, not a resume. Please upload your personal resume.'
    }
  }
  
  // Check for required resume sections - MUST have at least 2 of these (more lenient)
  const requiredSections = [
    'education', 'experience', 'skills', 'projects', 'certifications',
    'b.tech', 'bachelor', 'internship', 'resume', 'work', 'job', 'degree',
    'university', 'college', 'qualification', 'training', 'course'
  ]
  
  const foundSections = requiredSections.filter(section => 
    textLower.includes(section)
  )
  
  if (foundSections.length < 2) {
    return {
      status: 'invalid',
      message: `Invalid resume format. Your resume must include at least 2 of these sections: education, experience, skills, projects. Found: ${foundSections.join(', ') || 'none'}.`
    }
  }
  
  // Check for email address (required)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText)
  if (!hasEmail) {
    return {
      status: 'invalid',
      message: 'Resume must include a valid email address. Please upload a complete resume.'
    }
  }
  
  // Check for personal information indicators (more lenient)
  const personalIndicators = [
    /\b(name|contact|phone|mobile|address|email)\b/i,
    /\b(worked|employed|experience|years|job|career)\b/i,
    /\b(graduated|degree|university|college|bachelor|master|b\.tech|btech|education|school)\b/i,
    /\b(skills|proficient|experienced|technologies|programming|knowledge)\b/i,
    /\b(project|developed|created|built|designed|work)\b/i,
    /\b(internship|intern|trainee|fresher|entry.level|position)\b/i,
    /\b(certification|certified|course|training|qualification)\b/i,
    /\b(resume|cv|curriculum|profile)\b/i
  ]

  const personalMatches = personalIndicators.filter(pattern =>
    pattern.test(resumeText)
  ).length

  if (personalMatches < 1) {
    return {
      status: 'invalid',
      message: 'This does not appear to be a valid personal resume. Please upload a resume with your personal and professional information.'
    }
  }
  
  // Detect fake/template resumes (only headings without content)
  const headingOnlyPattern = /^\s*(education|skills|experience|projects|certifications|summary|objective|contact|name)\s*$/gim
  const headingMatches = resumeText.match(headingOnlyPattern) || []
  
  // If mostly just headings with very little content
  if (headingMatches.length >= 4 && totalWords < 80) {
    return {
      status: 'invalid',
      message: 'Resume appears to contain only section headings. Please upload a complete resume with detailed information under each section.'
    }
  }
  
  // Enhanced fake content detection
  const fakePatterns = [
    /lorem ipsum/i,
    /placeholder/i,
    /\[your name\]/i,
    /\[email\]/i,
    /sample resume/i,
    /template/i,
    /example resume/i,
    /dummy data/i,
    /test resume/i,
    /fake resume/i,
    /john doe/i,
    /jane doe/i,
    /\[phone\]/i,
    /\[address\]/i,
    /example@/i,
    /test@/i,
    /sample@/i,
    /dummy@/i,
    /fake@/i,
    /123-456-7890/i,
    /000-000-0000/i,
    /\+1 \(555\)/i
  ]
  
  const fakeMatches = fakePatterns.filter(pattern => pattern.test(resumeText)).length
  if (fakeMatches >= 1) {
    return {
      status: 'invalid',
      message: 'Please upload a real resume with your actual information, not a template or sample resume.'
    }
  }
  
  // Check for repetitive or generic content
  const words = resumeText.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  const repetitionRatio = uniqueWords.size / words.length
  
  if (words.length > 50 && repetitionRatio < 0.3) {
    return {
      status: 'invalid',
      message: 'Resume contains too much repetitive content. Please upload a genuine resume with varied information.'
    }
  }
  
  // Check for unrealistic content
  const unrealisticPatterns = [
    /expert in \d{2,} technologies/i,
    /\d{2,} years? experience.*\d{2,} years? experience/i,
    /proficient in all/i,
    /master of everything/i,
    /knows every/i
  ]
  
  const unrealisticMatches = unrealisticPatterns.filter(pattern => pattern.test(resumeText)).length
  if (unrealisticMatches >= 1) {
    return {
      status: 'invalid',
      message: 'Resume contains unrealistic claims. Please upload a genuine resume with accurate information.'
    }
  }
  
  // Additional validation: Check filename for resume indicators
  const isResumeFile = /\b(resume|cv|curriculum)\b/i.test(fileName)
  
  // If filename doesn't suggest it's a resume and content is questionable
  if (!isResumeFile && foundSections.length < 4) {
    return {
      status: 'invalid',
      message: 'File does not appear to be a resume. Please upload your personal resume with proper sections and information.'
    }
  }
  
  return { status: 'valid' }
}

// AI-based validation to detect fake or invalid resumes
export const validateResumeWithAI = async (resumeText, fileName) => {
  try {
    const client = getAzureAI()
    if (!client) {
      // Skip AI validation if not configured, rely on rule-based validation
      return { status: 'valid' }
    }
    
    // Only check for obvious fake content, be more lenient
    const prompt = `Analyze this document and determine if it's a REAL PERSONAL RESUME.

Document content:
${resumeText.substring(0, 1000)}

Filename: ${fileName}

ONLY REJECT if it contains:
1. Obvious placeholder text like "Lorem ipsum", "[Your Name]", "[Email]"
2. Clear template language like "Sample Resume", "Template", "Example"
3. Obviously fake names like "John Doe", "Jane Doe", "Test User"
4. Fake contact info like "test@example.com", "123-456-7890"
5. Job descriptions instead of personal resumes
6. Company profiles or academic papers

ACCEPT if it appears to be a genuine personal resume, even if:
- Names seem uncommon
- Content is brief
- Skills seem extensive
- Format is simple

Respond with ONLY this JSON format:
{
  "isValid": true/false,
  "reason": "specific reason if invalid"
}

Be LENIENT - only reject obvious fakes or wrong document types.`

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    })

    const result = JSON.parse(response.choices[0].message.content)
    
    if (!result.isValid) {
      return {
        status: 'invalid',
        message: result.reason || 'This document does not appear to be a valid personal resume.'
      }
    }
    
    return { status: 'valid' }
  } catch (error) {
    console.error('AI validation error:', error)
    // If AI validation fails, continue with rule-based validation
    return { status: 'valid' }
  }
}

export const analyzeResumeWithAzureAI = async (resumeText, fileName) => {
  try {
    console.log('✅ Starting AI analysis for:', fileName)
    console.log('📄 Resume text length:', resumeText?.length || 0)

    const client = getAzureAI()
    if (!client) {
      throw new Error('Azure AI not configured')
    }
    
    // Add unique identifiers to ensure different responses
    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 10000)
    const textHash = resumeText.substring(0, 100) // First 100 chars as unique identifier
    
    const skillRoleMap = {
      "Frontend Developer": ["JavaScript", "React", "HTML", "CSS", "Vue.js", "Angular"],
      "Backend Developer": ["Node.js", "Python", "Java", "SQL", "MongoDB", "Express"],
      "Full Stack Developer": ["JavaScript", "React", "Node.js", "MongoDB", "SQL"],
      "Data Scientist": ["Python", "R", "Machine Learning", "SQL", "Pandas", "NumPy"],
      "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
      "Mobile Developer": ["React Native", "Flutter", "Swift", "Kotlin", "Java"],
      "UI/UX Designer": ["Figma", "Adobe XD", "Sketch", "Photoshop", "User Research"]
    }

    const prompt = `CRITICAL: You MUST analyze the ACTUAL resume content and provide UNIQUE responses for each different resume.

RESUME ANALYSIS REQUEST #${timestamp}-${randomSeed}
File: ${fileName}
Content Preview: ${textHash}

You are analyzing a resume. Read the ENTIRE content below and extract REAL information:

=== RESUME CONTENT START ===
${resumeText}
=== RESUME CONTENT END ===

INSTRUCTIONS:
1. READ the actual resume text above
2. EXTRACT the real email address from the content
3. FIND actual skills, technologies, and programming languages mentioned
4. DETERMINE experience level from years mentioned or job titles
5. CREATE a summary based on the person's actual background
6. MATCH skills to appropriate job roles using this mapping:
${JSON.stringify(skillRoleMap, null, 2)}

RETURN ONLY this JSON format with ACTUAL extracted data:
{
  "status": "valid",
  "email": "[EXTRACT REAL EMAIL FROM CONTENT OR 'not_found']",
  "skills": ["[LIST ACTUAL SKILLS FOUND IN TEXT]"],
  "experience_level": "[Entry Level/Mid Level/Senior based on content]",
  "summary": "[WRITE SPECIFIC SUMMARY ABOUT THIS PERSON'S BACKGROUND]",
  "programmingSkills": ["[LIST ACTUAL PROGRAMMING LANGUAGES/FRAMEWORKS FOUND]"],
  "suitableJobRoles": ["[ROLES MATCHING THEIR ACTUAL SKILLS]"],
  "isProgrammingRelated": [true if programming skills found, false otherwise],
  "overallScore": [NUMBER 70-95 based on resume completeness],
  "atsScore": [NUMBER 65-90 based on formatting and keywords],
  "skillsMatch": [NUMBER 75-95 based on skill relevance],
  "strengths": ["[SPECIFIC STRENGTHS FROM THEIR ACTUAL CONTENT]"],
  "weaknesses": ["[AREAS FOR IMPROVEMENT BASED ON WHAT'S MISSING]"],
  "improvements": ["[SPECIFIC SUGGESTIONS FOR THIS RESUME]"],
  "missingSkills": ["[RELEVANT SKILLS NOT FOUND IN THEIR FIELD]"],
  "projects": ["[LIST ACTUAL PROJECTS MENTIONED IN RESUME]"]
}

DO NOT use generic responses. ANALYZE THE ACTUAL CONTENT ABOVE.`

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, // Increased for more variety
      max_tokens: 1500
    })

    const analysis = JSON.parse(response.choices[0].message.content)
    
    // Double-check the AI response for validation
    if (analysis.status === 'invalid') {
      return analysis
    }
    
    // Ensure email is extracted from actual content
    if (!analysis.email || analysis.email === 'candidate@email.com') {
      const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
      if (emailMatch) {
        analysis.email = emailMatch[0]
      } else {
        // Generate unique email based on filename and timestamp
        const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        analysis.email = `${baseName}${randomSeed}@example.com`
      }
    }
    
    console.log('✅ AI analysis completed for:', analysis.email)
    return analysis
  } catch (error) {
    console.error('Azure AI analysis error:', error)
    
    // Enhanced fallback analysis with unique content
    console.log('🔄 Using enhanced fallback analysis...')
    
    // Re-validate with fallback (maintain same validation standards)
    const fallbackValidation = validateResumeContent(resumeText, fileName || 'resume.pdf')
    if (fallbackValidation.status === 'invalid') {
      return fallbackValidation
    }
    
    // Generate unique identifiers for fallback
    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 10000)
    
    // Extract email for valid resume
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    let email
    if (emailMatch) {
      email = emailMatch[0]
    } else {
      const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      email = `${baseName}${randomSeed}@example.com`
    }
    
    // Extract skills and determine if programming-related
    const extractedSkills = extractSkillsFromText(resumeText)
    const programmingSkills = extractProgrammingSkills(resumeText)
    const isProgramming = containsProgrammingKeywords(resumeText)
    
    // Generate varied scores based on content quality and length
    const contentLength = resumeText.length
    const wordCount = resumeText.split(/\s+/).length
    const skillCount = extractedSkills.length + programmingSkills.length
    
    // Base scores on actual content metrics
    const baseScore = Math.min(95, 60 + Math.floor(contentLength / 100) + skillCount * 2)
    const atsScore = Math.min(90, 55 + Math.floor(wordCount / 50) + (emailMatch ? 10 : 0))
    const skillsScore = Math.min(95, 65 + skillCount * 3 + (isProgramming ? 10 : 5))
    
    // Extract projects from text
    const extractedProjects = extractProjectsFromText(resumeText)
    console.log('🎯 PROJECTS FOUND:', extractedProjects)
    
    return {
      status: 'valid',
      email: email,
      skills: extractedSkills.length > 0 ? extractedSkills : generateFallbackSkills(resumeText, isProgramming),
      experience_level: determineExperienceLevel(resumeText),
      summary: generateUniqueSummary(resumeText, fileName, isProgramming, extractedSkills),
      programmingSkills: programmingSkills,
      suitableJobRoles: generateJobRoles(extractedSkills, programmingSkills, isProgramming),
      isProgrammingRelated: isProgramming,
      overallScore: baseScore,
      atsScore: atsScore,
      skillsMatch: skillsScore,
      strengths: generateUniqueStrengths(extractedSkills, programmingSkills, isProgramming, resumeText),
      weaknesses: generateUniqueWeaknesses(resumeText, isProgramming, extractedSkills, programmingSkills),
      improvements: generateUniqueImprovements(resumeText, isProgramming, extractedSkills, programmingSkills),
      missingSkills: generateMissingSkills(extractedSkills, programmingSkills, isProgramming, resumeText),
      projects: extractedProjects
    }
  }
}

export const generateInterviewQuestions = async (resumeAnalysis) => {
  try {
    const client = getAzureAI()
    if (!client) {
      throw new Error('Azure AI not configured')
    }
    
    const { 
      skills = [], 
      programmingSkills = [], 
      experience_level = 'Mid Level', 
      suitableJobRoles = [], 
      isProgrammingRelated = false,
      summary = '',
      candidateEmail = 'candidate'
    } = resumeAnalysis
    
    const isProgramming = isProgrammingRelated || programmingSkills.length > 0
    const questionCount = 8
    
    // Add randomness to ensure different questions each time
    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 1000)
    
    const prompt = `
Generate exactly ${questionCount} UNIQUE interview questions for this specific candidate:

CANDIDATE PROFILE:
- Email: ${candidateEmail}
- Summary: ${summary}
- Skills: ${skills.join(', ')}
- Programming Skills: ${programmingSkills.join(', ')}
- Experience Level: ${experience_level}
- Suitable Roles: ${suitableJobRoles.join(', ')}
- Is Programming: ${isProgramming}

Timestamp: ${timestamp} | Seed: ${randomSeed}

GENERATE QUESTIONS THAT:
1. Are SPECIFIC to their exact skills (mention ${skills[0]}, ${programmingSkills[0]}, etc.)
2. Reference their experience level (${experience_level})
3. Are DIFFERENT each time (use timestamp/seed for variety)
4. Test their claimed expertise

${isProgramming ? 
  `PROGRAMMING CANDIDATE - Generate:
- 2 HR questions about their programming journey and career goals
- 4 Technical questions specifically about: ${programmingSkills.slice(0, 4).join(', ')}
- 2 Behavioral questions about coding projects and teamwork` :
  `NON-PROGRAMMING CANDIDATE - Generate:
- 3 HR questions about their background and motivation
- 2 Technical questions about: ${skills.slice(0, 2).join(', ')} (NO programming)
- 3 Behavioral questions about leadership and communication`
}

Return ONLY this JSON format:
[
  {
    "type": "HR|Technical|Behavioral",
    "question": "Specific question mentioning their skills",
    "timeLimit": 120
  }
]

Make each question UNIQUE and PERSONALIZED to this candidate's profile.`

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // Higher for more variety
      max_tokens: 2000
    })

    const questions = JSON.parse(response.choices[0].message.content)
    
    // Ensure we have at least 8 questions
    if (questions.length < 8) {
      const additionalQuestions = generateFallbackQuestions(resumeAnalysis, 8 - questions.length)
      questions.push(...additionalQuestions)
    }
    
    return questions.slice(0, 8)
  } catch (error) {
    console.error('Question generation error:', error)
    // Enhanced fallback questions based on resume
    return generateFallbackQuestions(resumeAnalysis, isProgramming ? 8 : 10)
  }
}

// Enhanced fallback question generator
const generateFallbackQuestions = (resumeAnalysis, count = 8) => {
  const { programmingSkills = [], skills = [], experience_level = 'Mid Level', isProgrammingRelated = false } = resumeAnalysis
  const isProgramming = isProgrammingRelated || programmingSkills.length > 0
  
  const hrQuestions = [
    { type: 'HR', question: 'Tell me about yourself and your professional background.', timeLimit: 120 },
    { type: 'HR', question: 'What interests you most about this role and our company?', timeLimit: 90 },
    { type: 'HR', question: 'Where do you see yourself in the next 3-5 years?', timeLimit: 120 },
    { type: 'HR', question: 'What are your salary expectations for this position?', timeLimit: 90 }
  ]
  
  const technicalQuestions = isProgramming ? [
    { type: 'Technical', question: `Explain your experience with ${programmingSkills[0] || 'programming'} and how you've used it in projects.`, timeLimit: 150 },
    { type: 'Technical', question: 'Walk me through your approach to debugging a complex issue in production.', timeLimit: 180 },
    { type: 'Technical', question: 'How do you ensure code quality and maintainability in your projects?', timeLimit: 150 },
    { type: 'Technical', question: 'Describe a challenging technical problem you solved and your approach.', timeLimit: 200 },
    { type: 'Technical', question: 'How do you stay updated with the latest technology trends and best practices?', timeLimit: 120 }
  ] : [
    { type: 'Technical', question: `How would you apply your ${skills[0] || 'professional'} skills to solve business challenges?`, timeLimit: 150 },
    { type: 'Technical', question: 'Describe your experience with industry-specific tools and processes.', timeLimit: 150 },
    { type: 'Technical', question: 'How do you ensure quality and accuracy in your work?', timeLimit: 120 },
    { type: 'Technical', question: 'Walk me through your problem-solving methodology.', timeLimit: 150 }
  ]
  
  const behavioralQuestions = [
    { type: 'Behavioral', question: 'Describe a time when you had to work with a difficult team member. How did you handle it?', timeLimit: 180 },
    { type: 'Behavioral', question: 'Tell me about a project where you had to learn something completely new. How did you approach it?', timeLimit: 180 },
    { type: 'Behavioral', question: 'Give me an example of a time when you had to meet a tight deadline. How did you manage it?', timeLimit: 150 },
    { type: 'Behavioral', question: 'Describe a situation where you had to make a decision with incomplete information.', timeLimit: 150 },
    { type: 'Behavioral', question: 'Tell me about a time when you received constructive criticism. How did you respond?', timeLimit: 120 },
    { type: 'Behavioral', question: 'Describe a situation where you had to persuade others to accept your idea.', timeLimit: 150 }
  ]
  
  // Mix questions based on candidate type
  const allQuestions = [...hrQuestions, ...technicalQuestions, ...behavioralQuestions]
  
  // Shuffle and return requested count
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const generateCodingQuestions = async (programmingSkills, experienceLevel) => {
  try {
    const client = getAzureAI()
    
    console.log('🎯 Generating coding questions for skills:', programmingSkills)
    
    // Add randomness to ensure different questions each time
    const timestamp = Date.now()
    const randomSeed = Math.floor(Math.random() * 1000)
    
    const prompt = `Generate 5 UNIQUE coding problems for: ${programmingSkills.join(', ')} at ${experienceLevel} level.

Timestamp: ${timestamp} | Seed: ${randomSeed}

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "title": "Unique Problem Title",
    "difficulty": "Easy|Medium|Hard",
    "description": "Clear problem description with constraints and examples",
    "example": "Input: [1,2,3]\nOutput: 6\nExplanation: Sum of array",
    "skills": ["${programmingSkills[0] || 'JavaScript'}"],
    "functionName": "solutionFunction",
    "testCases": [
      {"input": "[1,2,3]", "expected": "6"},
      {"input": "[4,5]", "expected": "9"}
    ]
  }
]

Requirements:
- Generate DIFFERENT problems each time (use timestamp/seed for variety)
- Focus on ${programmingSkills.join(', ')} technologies
- ${experienceLevel} difficulty level
- Include 2-3 test cases per problem
- Make problems practical and skill-specific
- Ensure JSON is valid
- NO duplicate or similar problems`

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, // Higher temperature for more variety
      max_tokens: 2500
    })

    const content = response.choices[0].message.content.trim()
    console.log('🤖 AI Response length:', content.length)
    
    // Clean up response if it has markdown formatting
    const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim()
    
    const questions = JSON.parse(cleanContent)
    console.log('✅ Generated', questions.length, 'unique questions')
    
    return questions
  } catch (error) {
    console.error('❌ Coding question generation error:', error)
    if (error.code === 'DeploymentNotFound') {
      throw new Error('Azure OpenAI deployment not found. Please check your deployment name in Azure Portal.')
    }
    throw new Error(`Failed to generate coding questions: ${error.message}`)
  }
}

export const generateAIResponse = async (prompt) => {
  try {
    const client = getAzureAI()
    if (!client) {
      throw new Error('Azure AI not configured')
    }
    
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('AI response generation error:', error)
    return 'AI analysis temporarily unavailable. Please try again later.'
  }
}

// Fallback functions for when Azure AI is not available
const extractSkillsFromText = (text) => {
  const skillKeywords = {
    // Programming Languages
    'JavaScript': ['javascript', 'js', 'node.js', 'nodejs'],
    'Python': ['python', 'py', 'django', 'flask', 'pandas', 'numpy'],
    'Java': ['java', 'spring', 'hibernate'],
    'React': ['react', 'reactjs', 'react.js'],
    'HTML': ['html', 'html5'],
    'CSS': ['css', 'css3', 'scss', 'sass'],
    'TypeScript': ['typescript', 'ts'],
    'Vue.js': ['vue', 'vuejs', 'vue.js'],
    'Angular': ['angular', 'angularjs'],
    'C++': ['c++', 'cpp'],
    'C#': ['c#', 'csharp'],
    'PHP': ['php'],
    'Ruby': ['ruby', 'rails'],
    'Go': ['golang', 'go'],
    'Swift': ['swift', 'ios'],
    'Kotlin': ['kotlin', 'android'],
    'Flutter': ['flutter', 'dart'],
    
    // Databases
    'SQL': ['sql', 'mysql', 'postgresql', 'sqlite'],
    'MongoDB': ['mongodb', 'mongo', 'nosql'],
    'Redis': ['redis'],
    
    // Cloud & DevOps
    'AWS': ['aws', 'amazon web services'],
    'Azure': ['azure', 'microsoft azure'],
    'Docker': ['docker', 'containerization'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'Git': ['git', 'github', 'gitlab'],
    
    // Frameworks & Libraries
    'Express': ['express', 'expressjs'],
    'Django': ['django'],
    'Spring': ['spring', 'spring boot'],
    
    // Soft Skills
    'Communication': ['communication', 'communicate', 'present', 'presentation'],
    'Leadership': ['leadership', 'lead', 'manage', 'management', 'supervisor'],
    'Team Work': ['teamwork', 'team work', 'collaborate', 'collaboration'],
    'Problem Solving': ['problem solving', 'analytical', 'analyze', 'troubleshoot'],
    'Project Management': ['project management', 'scrum', 'agile', 'jira'],
    
    // Tools
    'Microsoft Office': ['microsoft office', 'ms office', 'office'],
    'Excel': ['excel', 'spreadsheet'],
    'PowerPoint': ['powerpoint', 'ppt'],
    'Photoshop': ['photoshop', 'ps'],
    'Figma': ['figma'],
    'Adobe': ['adobe'],
    
    // Other
    'Machine Learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
    'Data Science': ['data science', 'data analysis', 'analytics'],
    'Marketing': ['marketing', 'digital marketing', 'seo'],
    'Sales': ['sales', 'business development'],
    'Customer Service': ['customer service', 'customer support']
  }
  
  const textLower = text.toLowerCase()
  const foundSkills = []
  
  // Check for each skill and its variations
  Object.entries(skillKeywords).forEach(([skill, variations]) => {
    const found = variations.some(variation => textLower.includes(variation))
    if (found) {
      foundSkills.push(skill)
    }
  })
  
  // Remove duplicates and return
  return [...new Set(foundSkills)]
}

// Helper functions for unique fallback responses
const generateFallbackSkills = (text, isProgramming) => {
  const textLower = text.toLowerCase()
  const skills = []
  
  if (isProgramming) {
    skills.push('Programming', 'Software Development', 'Problem Solving')
  } else {
    skills.push('Communication', 'Team Work', 'Problem Solving')
  }
  
  if (textLower.includes('manage')) skills.push('Management')
  if (textLower.includes('lead')) skills.push('Leadership')
  if (textLower.includes('design')) skills.push('Design')
  if (textLower.includes('market')) skills.push('Marketing')
  if (textLower.includes('sales')) skills.push('Sales')
  if (textLower.includes('customer')) skills.push('Customer Service')
  
  return [...new Set(skills)] // Remove duplicates
}

const generateUniqueSummary = (text, fileName, isProgramming, skills = []) => {
  const textLower = text.toLowerCase()
  const name = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, '')
  
  // Extract experience indicators
  const hasExperience = textLower.includes('experience') || textLower.includes('worked') || textLower.includes('employed')
  const isFresher = textLower.includes('fresher') || textLower.includes('graduate') || textLower.includes('entry level')
  const hasEducation = textLower.includes('university') || textLower.includes('college') || textLower.includes('degree')
  
  // Extract specific domains
  const domains = []
  if (textLower.includes('web') || textLower.includes('frontend') || textLower.includes('backend')) domains.push('web development')
  if (textLower.includes('mobile') || textLower.includes('android') || textLower.includes('ios')) domains.push('mobile development')
  if (textLower.includes('data') || textLower.includes('analytics') || textLower.includes('machine learning')) domains.push('data science')
  if (textLower.includes('design') || textLower.includes('ui') || textLower.includes('ux')) domains.push('design')
  if (textLower.includes('marketing') || textLower.includes('sales') || textLower.includes('business')) domains.push('business')
  
  let summary = ''
  
  if (isProgramming) {
    if (isFresher) {
      summary = `Recent graduate with programming skills in ${skills.slice(0, 2).join(' and ')}`
    } else if (hasExperience) {
      summary = `Experienced developer with expertise in ${domains.length > 0 ? domains[0] : 'software development'}`
    } else {
      summary = `Technical professional with programming knowledge in ${skills.slice(0, 2).join(' and ')}`
    }
  } else {
    if (isFresher) {
      summary = `Recent graduate seeking opportunities in ${domains.length > 0 ? domains[0] : 'professional field'}`
    } else if (hasExperience) {
      summary = `Professional with experience in ${domains.length > 0 ? domains[0] : 'industry operations'}`
    } else {
      summary = `Skilled professional with background in ${skills.slice(0, 2).join(' and ')}`
    }
  }
  
  return summary + (hasEducation ? ' with strong educational foundation.' : '.')
}

const generateJobRoles = (skills, programmingSkills, isProgramming) => {
  if (isProgramming && programmingSkills.length > 0) {
    const roles = []
    if (programmingSkills.includes('React') || programmingSkills.includes('JavaScript')) {
      roles.push('Frontend Developer')
    }
    if (programmingSkills.includes('Node.js') || programmingSkills.includes('Python')) {
      roles.push('Backend Developer')
    }
    if (programmingSkills.includes('React') && programmingSkills.includes('Node.js')) {
      roles.push('Full Stack Developer')
    }
    if (programmingSkills.includes('Python') && skills.includes('Data Analysis')) {
      roles.push('Data Scientist')
    }
    return roles.length > 0 ? roles : ['Software Developer', 'Web Developer']
  } else {
    const roles = []
    if (skills.includes('Marketing')) roles.push('Marketing Specialist')
    if (skills.includes('Sales')) roles.push('Sales Representative')
    if (skills.includes('Management')) roles.push('Project Manager')
    if (skills.includes('Design')) roles.push('Designer')
    return roles.length > 0 ? roles : ['Business Analyst', 'Operations Specialist']
  }
}

const generateUniqueStrengths = (skills, programmingSkills, isProgramming, resumeText = '') => {
  const strengths = []
  const textLower = resumeText.toLowerCase()
  
  if (isProgramming) {
    if (programmingSkills.length > 3) strengths.push(`Proficiency in multiple technologies: ${programmingSkills.slice(0, 3).join(', ')}`)
    if (programmingSkills.includes('React') || programmingSkills.includes('Vue') || programmingSkills.includes('Angular')) {
      strengths.push('Modern frontend framework expertise')
    }
    if (programmingSkills.includes('Node.js') || programmingSkills.includes('Python') || programmingSkills.includes('Java')) {
      strengths.push('Strong backend development capabilities')
    }
    const projectCount = extractProjectsFromText(resumeText).length
    if (projectCount > 0) {
      strengths.push(`Practical project experience (${projectCount} projects mentioned)`)
    }
    if (programmingSkills.length <= 3 && programmingSkills.length > 0) {
      strengths.push(`Focused expertise in ${programmingSkills.join(' and ')}`)
    }
  } else {
    if (skills.includes('Leadership') || textLower.includes('lead') || textLower.includes('manage')) {
      strengths.push('Leadership and team management capabilities')
    }
    if (skills.includes('Communication') || textLower.includes('present') || textLower.includes('communicate')) {
      strengths.push('Excellent communication and presentation skills')
    }
    if (textLower.includes('customer') || textLower.includes('client')) {
      strengths.push('Customer relationship management experience')
    }
    if (skills.length > 4) {
      strengths.push(`Diverse skill set including ${skills.slice(0, 3).join(', ')}`)
    }
  }
  
  // Add generic strengths if not enough specific ones
  if (strengths.length < 2) {
    strengths.push(isProgramming ? 'Problem-solving and analytical thinking' : 'Professional work ethic and adaptability')
  }
  
  return strengths.slice(0, 3)
}

const generateUniqueWeaknesses = (text, isProgramming, skills = [], programmingSkills = []) => {
  const weaknesses = []
  const textLower = text.toLowerCase()
  
  if (isProgramming) {
    if (!textLower.includes('github') && !textLower.includes('portfolio') && !textLower.includes('project')) {
      weaknesses.push('Missing portfolio or project showcase links')
    }
    if (programmingSkills.length < 3) {
      weaknesses.push('Limited technology stack breadth')
    }
    if (!textLower.includes('test') && !textLower.includes('debug')) {
      weaknesses.push('Could emphasize testing and debugging experience')
    }
    if (!textLower.includes('team') && !textLower.includes('collaborate')) {
      weaknesses.push('Limited collaborative development experience mentioned')
    }
  } else {
    if (!textLower.includes('achievement') && !textLower.includes('result') && !textLower.includes('impact')) {
      weaknesses.push('Lacks quantifiable achievements and results')
    }
    if (!textLower.includes('certification') && !textLower.includes('training')) {
      weaknesses.push('Missing professional certifications or training')
    }
    if (skills.length < 5) {
      weaknesses.push('Could expand skill set for broader opportunities')
    }
    if (!textLower.includes('leadership') && !textLower.includes('manage')) {
      weaknesses.push('Limited leadership or management experience')
    }
  }
  
  return weaknesses.slice(0, 2)
}

const generateUniqueImprovements = (text, isProgramming, skills = [], programmingSkills = []) => {
  const improvements = []
  const textLower = text.toLowerCase()
  
  if (isProgramming) {
    if (!textLower.includes('github') && !textLower.includes('portfolio')) {
      improvements.push('Add GitHub profile and portfolio links to showcase projects')
    }
    if (programmingSkills.length > 0 && !textLower.includes('project')) {
      improvements.push(`Create projects demonstrating ${programmingSkills.slice(0, 2).join(' and ')} skills`)
    }
    if (!textLower.includes('certification') && !textLower.includes('course')) {
      improvements.push('Consider adding relevant technical certifications')
    }
    if (!textLower.includes('contribute') && !textLower.includes('open source')) {
      improvements.push('Highlight open source contributions or collaborative work')
    }
  } else {
    if (!textLower.includes('number') && !textLower.includes('%') && !textLower.includes('increase')) {
      improvements.push('Add quantifiable metrics and achievements with numbers')
    }
    if (!textLower.includes('award') && !textLower.includes('recognition')) {
      improvements.push('Include any awards, recognition, or notable accomplishments')
    }
    if (skills.length < 6) {
      improvements.push('Expand skill section with more relevant industry skills')
    }
    if (!textLower.includes('volunteer') && !textLower.includes('extracurricular')) {
      improvements.push('Consider adding volunteer work or extracurricular activities')
    }
  }
  
  return improvements.slice(0, 3)
}

const generateMissingSkills = (skills, programmingSkills, isProgramming, resumeText = '') => {
  const missing = []
  const textLower = resumeText.toLowerCase()
  
  if (isProgramming) {
    // Version control
    if (!programmingSkills.includes('Git') && !textLower.includes('git') && !textLower.includes('version control')) {
      missing.push('Git/Version Control')
    }
    
    // Cloud platforms
    if (!textLower.includes('aws') && !textLower.includes('azure') && !textLower.includes('cloud')) {
      missing.push('Cloud Platforms (AWS/Azure)')
    }
    
    // Testing
    if (!textLower.includes('test') && !textLower.includes('jest') && !textLower.includes('junit')) {
      missing.push('Testing Frameworks')
    }
    
    // Database skills
    if (!programmingSkills.includes('SQL') && !textLower.includes('database') && !textLower.includes('mongodb')) {
      missing.push('Database Management')
    }
    
    // DevOps
    if (!textLower.includes('docker') && !textLower.includes('ci/cd') && !textLower.includes('deployment')) {
      missing.push('DevOps/CI-CD')
    }
    
    // API development
    if (!textLower.includes('api') && !textLower.includes('rest') && !textLower.includes('graphql')) {
      missing.push('API Development')
    }
  } else {
    // Project management
    if (!skills.includes('Project Management') && !textLower.includes('project') && !textLower.includes('manage')) {
      missing.push('Project Management')
    }
    
    // Data analysis
    if (!textLower.includes('data') && !textLower.includes('analytics') && !textLower.includes('excel')) {
      missing.push('Data Analysis')
    }
    
    // Digital skills
    if (!textLower.includes('digital') && !textLower.includes('social media') && !textLower.includes('marketing')) {
      missing.push('Digital Marketing')
    }
    
    // Communication tools
    if (!textLower.includes('slack') && !textLower.includes('teams') && !textLower.includes('collaboration')) {
      missing.push('Collaboration Tools')
    }
    
    // Industry certifications
    if (!textLower.includes('certification') && !textLower.includes('certified')) {
      missing.push('Industry Certifications')
    }
  }
  
  return missing.slice(0, 4)
}

const extractProgrammingSkills = (text) => {
  const programmingKeywords = {
    'JavaScript': ['javascript', 'js'],
    'Python': ['python', 'py'],
    'Java': ['java'],
    'React': ['react', 'reactjs', 'react.js'],
    'Node.js': ['node.js', 'nodejs', 'node'],
    'HTML': ['html', 'html5'],
    'CSS': ['css', 'css3', 'scss', 'sass'],
    'TypeScript': ['typescript', 'ts'],
    'Vue.js': ['vue', 'vuejs', 'vue.js'],
    'Angular': ['angular', 'angularjs'],
    'Express': ['express', 'expressjs'],
    'Django': ['django'],
    'Flask': ['flask'],
    'Spring': ['spring', 'spring boot'],
    'C++': ['c++', 'cpp'],
    'C#': ['c#', 'csharp'],
    'PHP': ['php'],
    'Ruby': ['ruby'],
    'Go': ['golang', 'go'],
    'Swift': ['swift'],
    'Kotlin': ['kotlin'],
    'Flutter': ['flutter'],
    'SQL': ['sql', 'mysql', 'postgresql'],
    'MongoDB': ['mongodb', 'mongo'],
    'Git': ['git', 'github', 'gitlab'],
    'Docker': ['docker'],
    'AWS': ['aws'],
    'Azure': ['azure']
  }
  
  const textLower = text.toLowerCase()
  const foundSkills = []
  
  Object.entries(programmingKeywords).forEach(([skill, variations]) => {
    const found = variations.some(variation => textLower.includes(variation))
    if (found) {
      foundSkills.push(skill)
    }
  })
  
  return [...new Set(foundSkills)]
}

const determineExperienceLevel = (text) => {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('senior') || lowerText.includes('lead') || lowerText.includes('architect')) {
    return 'Senior'
  } else if (lowerText.includes('years') && (lowerText.includes('2') || lowerText.includes('3') || lowerText.includes('4'))) {
    return 'Mid Level'
  } else {
    return 'Entry Level'
  }
}

const containsProgrammingKeywords = (text) => {
  const programmingKeywords = [
    'programming', 'coding', 'developer', 'software', 'javascript', 'python', 'java',
    'react', 'node', 'html', 'css', 'mongodb', 'sql', 'git', 'github', 'frontend',
    'backend', 'fullstack', 'web development', 'mobile development', 'app development',
    'algorithm', 'data structure', 'framework', 'library', 'api', 'database'
  ]
  
  return programmingKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
}

const extractProjectsFromText = (text) => {
  const projects = []
  const lines = text.split('\n')
  const textLower = text.toLowerCase()
  
  // Look for project section indicators
  const projectSectionStart = lines.findIndex(line => 
    /^\s*(projects?|personal projects?|academic projects?|work projects?)\s*:?\s*$/i.test(line.trim())
  )
  
  if (projectSectionStart !== -1) {
    // Extract projects from dedicated section
    for (let i = projectSectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Stop if we hit another section
      if (/^\s*(experience|education|skills|certifications?)\s*:?\s*$/i.test(line)) break
      
      // Project titles are usually bullet points or numbered
      if (/^[•\-\*\d\.]/.test(line) || line.length > 10) {
        const project = line.replace(/^[•\-\*\d\.\s]+/, '').trim()
        if (project.length > 5) projects.push(project)
      }
    }
  } else {
    // Look for project keywords throughout the text
    const projectKeywords = ['built', 'developed', 'created', 'designed', 'implemented', 'project']
    
    lines.forEach(line => {
      const lineLower = line.toLowerCase()
      if (projectKeywords.some(keyword => lineLower.includes(keyword))) {
        // Extract potential project descriptions
        const cleaned = line.trim().replace(/^[•\-\*\d\.\s]+/, '')
        if (cleaned.length > 15 && cleaned.length < 150) {
          projects.push(cleaned)
        }
      }
    })
  }
  
  // If no projects found, look for technology mentions that might indicate projects
  if (projects.length === 0) {
    const techMentions = []
    if (textLower.includes('website')) techMentions.push('Website Development')
    if (textLower.includes('app') || textLower.includes('application')) techMentions.push('Application Development')
    if (textLower.includes('system')) techMentions.push('System Development')
    if (textLower.includes('dashboard')) techMentions.push('Dashboard Creation')
    if (textLower.includes('api')) techMentions.push('API Development')
    
    return techMentions.slice(0, 3)
  }
  
  return projects.slice(0, 5)
}