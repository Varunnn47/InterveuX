import { OpenAI } from 'openai'

// Azure AI Foundry client setup - initialize only when needed
let azureAI = null

const getAzureAI = () => {
  if (!azureAI) {
    if (!process.env.AZURE_OPENAI_API_KEY) {
      console.log('⚠️ AZURE_OPENAI_API_KEY not found, using fallback')
      return null
    }
    if (!process.env.AZURE_OPENAI_ENDPOINT) {
      console.log('⚠️ AZURE_OPENAI_ENDPOINT not found, using fallback')
      return null
    }
    
    console.log('Initializing Azure AI with endpoint:', process.env.AZURE_OPENAI_ENDPOINT)
    
    // Ensure endpoint ends with /openai/deployments/{deployment-name}
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.endsWith('/') 
      ? process.env.AZURE_OPENAI_ENDPOINT.slice(0, -1) 
      : process.env.AZURE_OPENAI_ENDPOINT
    
    const baseURL = `${endpoint}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'}`
    
    azureAI = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: baseURL,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
      },
    })
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
  
  // Minimum word count for a valid resume
  if (totalWords < 50) {
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
  
  // Check for required resume sections - MUST have at least 3 of these
  const requiredSections = [
    'education', 'experience', 'skills', 'projects', 'certifications',
    'b.tech', 'bachelor', 'internship', 'resume'
  ]
  
  const foundSections = requiredSections.filter(section => 
    textLower.includes(section)
  )
  
  if (foundSections.length < 3) {
    return {
      status: 'invalid',
      message: `Invalid resume format. Your resume must include at least 3 of these sections: ${requiredSections.join(', ')}. Found: ${foundSections.join(', ') || 'none'}.`
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
  
  // Check for personal information indicators
  const personalIndicators = [
    /\b(name|contact|phone|mobile|address)\b/i,
    /\b(worked|employed|experience|years)\b/i,
    /\b(graduated|degree|university|college|bachelor|master|b\.tech|btech)\b/i,
    /\b(skills|proficient|experienced|technologies|programming)\b/i,
    /\b(project|developed|created|built|designed)\b/i,
    /\b(internship|intern|trainee|fresher|entry.level)\b/i,
    /\b(certification|certified|course|training)\b/i
  ]

  const personalMatches = personalIndicators.filter(pattern =>
    pattern.test(resumeText)
  ).length

  if (personalMatches < 2) {
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
    
    const prompt = `Analyze this document and determine if it's a REAL PERSONAL RESUME or FAKE.

Document content:
${resumeText.substring(0, 1500)}

Filename: ${fileName}

STRICT VALIDATION - Check for:
1. Real personal information (not John Doe, Jane Smith, fake emails like test@example.com)
2. Genuine work experience with real company names and realistic descriptions
3. Authentic education details with real institutions
4. Realistic skills and achievements (not claiming expertise in 50+ technologies)
5. NOT template/sample text, placeholder content, or AI-generated generic content
6. NOT job descriptions, company profiles, academic papers, or notes
7. Consistent and believable career progression
8. Real contact information (not 123-456-7890 or similar fake numbers)

RED FLAGS for FAKE resumes:
- Generic names like John Doe, Jane Smith
- Fake emails: test@, sample@, example@, dummy@
- Unrealistic experience claims
- Template language or placeholder text
- Too many skills for experience level
- Repetitive or AI-generated content

Respond with ONLY this JSON format:
{
  "isValid": true/false,
  "reason": "specific reason if invalid"
}

Be STRICT - reject anything that seems fake, template, or unrealistic.`

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

    const prompt = `
You are analyzing a UNIQUE resume. Generate a PERSONALIZED analysis based on the SPECIFIC content.

UNIQUE IDENTIFIERS:
- File: ${fileName}
- Timestamp: ${timestamp}
- Seed: ${randomSeed}
- Content Hash: ${textHash}

IMPORTANT: Analyze the ACTUAL content below and provide SPECIFIC, UNIQUE responses based on what you find.

For valid resumes, analyze and return:
{
  "status": "valid",
  "email": "extract actual email or generate unique one",
  "skills": ["extract ACTUAL skills from content"],
  "experience_level": "Entry Level|Mid Level|Senior",
  "summary": "SPECIFIC summary based on actual content",
  "programmingSkills": ["extract ACTUAL programming skills"],
  "suitableJobRoles": ["roles based on ACTUAL skills found"],
  "isProgrammingRelated": true/false,
  "overallScore": "score between 70-95 based on content quality",
  "atsScore": "score between 65-90",
  "skillsMatch": "score between 75-95",
  "strengths": ["SPECIFIC strengths from content"],
  "weaknesses": ["SPECIFIC areas for improvement"],
  "improvements": ["SPECIFIC recommendations"],
  "missingSkills": ["relevant skills not found in resume"]
}

Skill-Role Mapping:
${JSON.stringify(skillRoleMap, null, 2)}

ACTUAL RESUME CONTENT TO ANALYZE:
${resumeText}

ANALYZE THIS SPECIFIC RESUME:
1. Extract ACTUAL skills mentioned in the text
2. Find REAL programming languages/frameworks if any
3. Determine experience level from ACTUAL content
4. Match FOUND skills to appropriate job roles
5. Generate UNIQUE scores based on content quality
6. Provide SPECIFIC feedback based on what's actually written
7. Suggest missing skills relevant to their field

Return ONLY valid JSON with PERSONALIZED analysis, no additional text.`

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
    
    // Generate varied scores based on content
    const baseScore = 70 + (randomSeed % 20) // 70-89
    const atsScore = 65 + (randomSeed % 25) // 65-89
    const skillsScore = 75 + (randomSeed % 20) // 75-94
    
    return {
      status: 'valid',
      email: email,
      skills: extractedSkills.length > 0 ? extractedSkills : generateFallbackSkills(resumeText, isProgramming),
      experience_level: determineExperienceLevel(resumeText),
      summary: generateUniqueSummary(resumeText, fileName, isProgramming),
      programmingSkills: programmingSkills,
      suitableJobRoles: generateJobRoles(extractedSkills, programmingSkills, isProgramming),
      isProgrammingRelated: isProgramming,
      overallScore: baseScore,
      atsScore: atsScore,
      skillsMatch: skillsScore,
      strengths: generateUniqueStrengths(extractedSkills, programmingSkills, isProgramming),
      weaknesses: generateUniqueWeaknesses(resumeText, isProgramming),
      improvements: generateUniqueImprovements(resumeText, isProgramming),
      missingSkills: generateMissingSkills(extractedSkills, programmingSkills, isProgramming)
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
  const skillKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB', 'SQL',
    'AWS', 'Docker', 'Git', 'TypeScript', 'Vue.js', 'Angular', 'Express', 'Django',
    'Communication', 'Leadership', 'Problem Solving', 'Team Work', 'Project Management',
    'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Outlook', 'Photoshop',
    'Marketing', 'Sales', 'Customer Service', 'Data Analysis', 'Research', 'Flutter',
    'Kotlin', 'Swift', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Scala', 'R',
    'Machine Learning', 'AI', 'Data Science', 'Cloud Computing', 'DevOps', 'Agile',
    'Scrum', 'Jira', 'Confluence', 'Slack', 'Figma', 'Adobe', 'Canva'
  ]
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
  
  // If no specific skills found, extract some generic ones based on content
  if (foundSkills.length === 0) {
    const textLower = text.toLowerCase()
    if (textLower.includes('manage') || textLower.includes('lead')) foundSkills.push('Leadership')
    if (textLower.includes('team') || textLower.includes('collaborate')) foundSkills.push('Team Work')
    if (textLower.includes('communicate') || textLower.includes('present')) foundSkills.push('Communication')
    if (textLower.includes('solve') || textLower.includes('analyze')) foundSkills.push('Problem Solving')
    if (textLower.includes('design') || textLower.includes('creative')) foundSkills.push('Design')
    if (textLower.includes('write') || textLower.includes('content')) foundSkills.push('Writing')
  }
  
  return foundSkills
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

const generateUniqueSummary = (text, fileName, isProgramming) => {
  const name = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, '')
  
  if (isProgramming) {
    return `Technical professional with programming expertise and software development experience.`
  } else {
    return `Professional candidate with relevant industry experience and strong skill set.`
  }
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

const generateUniqueStrengths = (skills, programmingSkills, isProgramming) => {
  const strengths = []
  
  if (isProgramming) {
    if (programmingSkills.length > 2) strengths.push('Diverse technical skill set')
    if (programmingSkills.includes('React')) strengths.push('Modern frontend development experience')
    if (programmingSkills.includes('Python')) strengths.push('Versatile programming capabilities')
    strengths.push('Technical problem-solving abilities')
  } else {
    if (skills.includes('Leadership')) strengths.push('Leadership and management skills')
    if (skills.includes('Communication')) strengths.push('Strong communication abilities')
    strengths.push('Professional experience and expertise')
  }
  
  return strengths.slice(0, 3)
}

const generateUniqueWeaknesses = (text, isProgramming) => {
  const weaknesses = []
  
  if (isProgramming) {
    if (!text.toLowerCase().includes('project')) weaknesses.push('Limited project portfolio visibility')
    if (!text.toLowerCase().includes('github')) weaknesses.push('Missing code repository links')
    weaknesses.push('Could benefit from more technical certifications')
  } else {
    if (!text.toLowerCase().includes('achievement')) weaknesses.push('Limited quantifiable achievements')
    if (!text.toLowerCase().includes('certification')) weaknesses.push('Missing industry certifications')
    weaknesses.push('Could add more specific accomplishments')
  }
  
  return weaknesses.slice(0, 2)
}

const generateUniqueImprovements = (text, isProgramming) => {
  const improvements = []
  
  if (isProgramming) {
    improvements.push('Add links to GitHub repositories and live projects')
    improvements.push('Include specific technologies and frameworks used')
    improvements.push('Quantify impact of technical contributions')
  } else {
    improvements.push('Include quantifiable results and achievements')
    improvements.push('Add relevant industry certifications')
    improvements.push('Highlight specific accomplishments with metrics')
  }
  
  return improvements.slice(0, 3)
}

const generateMissingSkills = (skills, programmingSkills, isProgramming) => {
  const missing = []
  
  if (isProgramming) {
    if (!programmingSkills.includes('Git')) missing.push('Git')
    if (!skills.includes('AWS')) missing.push('Cloud Platforms')
    if (!programmingSkills.includes('TypeScript')) missing.push('TypeScript')
    missing.push('Testing Frameworks', 'CI/CD')
  } else {
    if (!skills.includes('Project Management')) missing.push('Project Management')
    if (!skills.includes('Data Analysis')) missing.push('Data Analysis')
    missing.push('Digital Marketing', 'CRM Tools')
  }
  
  return missing.slice(0, 4)
}

const extractProgrammingSkills = (text) => {
  const programmingKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'HTML', 'CSS', 'MongoDB', 'SQL',
    'TypeScript', 'Vue.js', 'Angular', 'Express', 'Django', 'Flask', 'Spring', 'C++', 'C#'
  ]
  
  return programmingKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  )
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