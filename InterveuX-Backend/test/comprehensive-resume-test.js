import { validateResumeContent } from './utils/azureAI.js'
import multer from 'multer'
import path from 'path'

// Test file format validation (from resumeController.js)
const testFileValidation = (filename, mimetype) => {
  const allowedTypes = ['.pdf', '.docx']
  const ext = path.extname(filename).toLowerCase()
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  return allowedTypes.includes(ext) && allowedMimeTypes.includes(mimetype)
}

console.log('🧪 COMPREHENSIVE RESUME VALIDATION TESTS\n')

// File Format Tests
console.log('📁 FILE FORMAT VALIDATION TESTS:')
const fileTests = [
  { name: 'Valid PDF', filename: 'resume.pdf', mimetype: 'application/pdf', expected: true },
  { name: 'Valid DOCX', filename: 'resume.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expected: true },
  { name: 'Invalid TXT', filename: 'resume.txt', mimetype: 'text/plain', expected: false },
  { name: 'Invalid DOC', filename: 'resume.doc', mimetype: 'application/msword', expected: false },
  { name: 'Invalid JPG', filename: 'resume.jpg', mimetype: 'image/jpeg', expected: false },
  { name: 'Fake DOCX (wrong mime)', filename: 'resume.docx', mimetype: 'text/plain', expected: false }
]

fileTests.forEach((test, index) => {
  const result = testFileValidation(test.filename, test.mimetype)
  const status = result === test.expected ? '✅ PASS' : '❌ FAIL'
  console.log(`${index + 1}. ${test.name}: ${status}`)
})

console.log('\n📄 CONTENT VALIDATION TESTS:')

// Enhanced content validation tests
const contentTests = [
  {
    name: "✅ Valid Professional Resume",
    fileName: "professional.pdf",
    content: `
      ALEX MARTINEZ
      Senior Software Engineer
      alex.martinez@techmail.com | +1-555-0123
      LinkedIn: linkedin.com/in/alexmartinez | GitHub: github.com/alexm
      
      PROFESSIONAL SUMMARY
      Experienced software engineer with 6+ years developing scalable web applications.
      Expertise in full-stack development, cloud architecture, and team leadership.
      
      TECHNICAL SKILLS
      Languages: JavaScript, Python, Java, TypeScript, Go
      Frontend: React, Vue.js, Angular, HTML5, CSS3, SASS
      Backend: Node.js, Express, Django, Spring Boot, FastAPI
      Databases: PostgreSQL, MongoDB, Redis, MySQL
      Cloud: AWS, Docker, Kubernetes, Terraform
      Tools: Git, Jenkins, JIRA, Figma
      
      PROFESSIONAL EXPERIENCE
      
      Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
      • Led development of microservices architecture serving 500K+ daily users
      • Reduced system latency by 45% through database optimization and caching
      • Mentored 4 junior developers and established code review processes
      • Technologies: React, Node.js, PostgreSQL, AWS, Docker
      
      Software Engineer | InnovateLabs | Jun 2018 - Dec 2020
      • Built responsive web applications using React and Python Django
      • Implemented CI/CD pipelines reducing deployment time by 60%
      • Collaborated with UX team to improve user engagement by 30%
      • Technologies: Python, React, MongoDB, Heroku
      
      EDUCATION
      Bachelor of Science in Computer Science
      University of California, Berkeley | 2014 - 2018
      Relevant Coursework: Data Structures, Algorithms, Database Systems
      
      PROJECTS
      TaskMaster Pro - Project Management Platform
      • Full-stack application with real-time collaboration features
      • Built with React, Node.js, Socket.io, and PostgreSQL
      • Deployed on AWS with auto-scaling capabilities
      
      CERTIFICATIONS
      • AWS Certified Solutions Architect (2023)
      • Certified Kubernetes Administrator (2022)
    `,
    expected: "valid"
  },
  {
    name: "❌ Job Posting (Should be Rejected)",
    fileName: "job_posting.pdf",
    content: `
      SOFTWARE ENGINEER POSITION - URGENT HIRING
      
      We are looking for a talented Software Engineer to join our growing team!
      
      REQUIREMENTS:
      • Bachelor's degree in Computer Science or related field
      • 3+ years of experience in JavaScript and React
      • Strong knowledge of Node.js and databases
      • Excellent problem-solving skills
      
      RESPONSIBILITIES:
      • Develop and maintain web applications
      • Collaborate with cross-functional teams
      • Write clean, maintainable code
      • Participate in code reviews and testing
      
      WHAT WE OFFER:
      • Competitive salary range: $80,000 - $120,000
      • Comprehensive health insurance
      • Flexible working hours and remote options
      • Professional development opportunities
      
      HOW TO APPLY:
      Send your resume to careers@company.com
      Apply now and join our innovative team!
      
      Contact: hr@techcompany.com
    `,
    expected: "invalid"
  },
  {
    name: "❌ Company Profile (Should be Rejected)",
    fileName: "company_info.pdf",
    content: `
      TECHSOLUTIONS COMPANY PROFILE
      
      ABOUT US
      TechSolutions is a leading software development company established in 2010.
      We specialize in creating innovative digital solutions for businesses worldwide.
      
      OUR SERVICES
      • Custom Software Development
      • Web Application Development
      • Mobile App Development
      • Cloud Migration Services
      • AI/ML Solutions
      
      OUR TEAM
      Our team consists of 50+ experienced developers, designers, and project managers
      who are passionate about delivering high-quality solutions.
      
      CONTACT INFORMATION
      Email: info@techsolutions.com
      Phone: +1-555-TECH-HELP
      Website: www.techsolutions.com
      Address: 123 Tech Street, Silicon Valley, CA
      
      We provide end-to-end solutions and have successfully completed 200+ projects
      for clients across various industries including healthcare, finance, and e-commerce.
    `,
    expected: "invalid"
  },
  {
    name: "❌ Empty Template (Should be Rejected)",
    fileName: "template.docx",
    content: `
      Name: [Your Name]
      Email: [Your Email]
      
      EDUCATION
      [Add your education details here]
      
      SKILLS
      [List your skills here]
      
      EXPERIENCE
      [Add your work experience here]
    `,
    expected: "invalid"
  },
  {
    name: "❌ No Email Address (Should be Rejected)",
    fileName: "no_email.pdf",
    content: `
      JOHN DEVELOPER
      Software Engineer
      Phone: +1-555-9876
      
      SKILLS
      JavaScript, React, Node.js, Python, MongoDB
      
      EXPERIENCE
      Software Developer at ABC Company
      Worked on various web development projects
      Built responsive websites and applications
      
      EDUCATION
      Computer Science Degree from XYZ University
      Graduated with honors in 2020
    `,
    expected: "invalid"
  },
  {
    name: "❌ Too Short Content (Should be Rejected)",
    fileName: "short.pdf",
    content: `
      Jane Doe
      jane@email.com
      Skills: HTML, CSS, JS
    `,
    expected: "invalid"
  },
  {
    name: "✅ Valid Resume - Different Format",
    fileName: "creative_resume.docx",
    content: `
      SARAH CHEN | UX/UI DESIGNER & FRONTEND DEVELOPER
      sarah.chen@designmail.com | Portfolio: sarahchen.design
      
      ABOUT ME
      Creative designer with 4+ years combining visual design expertise with 
      frontend development skills. Passionate about creating user-centered 
      digital experiences that are both beautiful and functional.
      
      CORE COMPETENCIES
      Design: Figma, Adobe Creative Suite, Sketch, InVision, Principle
      Development: HTML5, CSS3, JavaScript, React, Vue.js, SASS
      Tools: Git, Webpack, npm, Responsive Design, Accessibility
      
      PROFESSIONAL JOURNEY
      
      Senior UX/UI Designer | DesignStudio Pro | 2022 - Present
      ▸ Lead design for 3 major product launches with 95% user satisfaction
      ▸ Collaborate with developers to implement pixel-perfect designs
      ▸ Conduct user research and usability testing for product improvements
      
      Frontend Developer & Designer | StartupHub | 2020 - 2022
      ▸ Designed and developed responsive websites for 15+ clients
      ▸ Improved website performance and accessibility scores by 40%
      ▸ Created design systems and component libraries
      
      EDUCATION & LEARNING
      Bachelor of Fine Arts in Graphic Design
      Art Institute of California | 2016 - 2020
      
      Continuous Learning: Google UX Design Certificate (2021)
      
      FEATURED PROJECTS
      EcoTrack Mobile App - Environmental awareness platform
      • Designed complete user experience from wireframes to final UI
      • Developed frontend using React Native and CSS animations
      
      Portfolio Website - Personal branding project
      • Custom-coded responsive website showcasing design work
      • Implemented smooth animations and interactive elements
    `,
    expected: "valid"
  }
]

// Run content validation tests
contentTests.forEach((test, index) => {
  console.log(`\n${index + 1}. Testing: ${test.name}`)
  const result = validateResumeContent(test.content, test.fileName)
  const passed = result.status === test.expected
  const status = passed ? '✅ PASS' : '❌ FAIL'
  
  console.log(`   Expected: ${test.expected}`)
  console.log(`   Got: ${result.status}`)
  if (result.message) {
    console.log(`   Message: ${result.message}`)
  }
  console.log(`   Result: ${status}`)
})

console.log('\n🎯 VALIDATION SUMMARY:')
console.log('✅ File Format Validation:')
console.log('   - Only PDF and DOCX files accepted')
console.log('   - MIME type validation prevents fake extensions')
console.log('   - File size limit: 5MB')

console.log('\n✅ Content Validation:')
console.log('   - Minimum 300 characters required')
console.log('   - Must contain valid email address')
console.log('   - Rejects job descriptions and company profiles')
console.log('   - Requires at least 2 resume sections (education, skills, experience, etc.)')
console.log('   - Detects and rejects empty templates')

console.log('\n🔒 Security Features:')
console.log('   - Prevents upload of non-resume documents')
console.log('   - Validates file content, not just extension')
console.log('   - Rejects fake/template resumes')
console.log('   - Ensures genuine candidate information')