import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import pdf from 'pdf-parse'

export const extractTextFromFile = async (filePath) => {
  try {
    console.log('📄 Extracting text from:', filePath)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    
    const fileStats = fs.statSync(filePath)
    console.log('📄 File size:', fileStats.size, 'bytes')
    
    const ext = path.extname(filePath).toLowerCase()
    console.log('📄 File extension:', ext)
    
    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath)
        console.log('📄 PDF buffer size:', dataBuffer.length)
        
        const pdfData = await pdf(dataBuffer)
        console.log('📄 Extracted PDF text length:', pdfData.text.length)
        console.log('📄 PDF pages:', pdfData.numpages)
        
        // Show first 200 characters for debugging
        if (pdfData.text.length > 0) {
          console.log('📄 First 200 chars:', pdfData.text.substring(0, 200))
        }
        
        if (!pdfData.text || pdfData.text.trim().length === 0) {
          console.warn('⚠️ PDF appears to be empty or image-based')
          throw new Error('PDF file appears to be empty or contains only images. Please upload a text-based resume.')
        }
        
        return pdfData.text
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        throw new Error(`Failed to extract text from PDF: ${pdfError.message}`)
      }
    } else if (ext === '.docx') {
      try {
        const result = await mammoth.extractRawText({ path: filePath })
        console.log('📄 Extracted DOCX text length:', result.value.length)
        
        if (result.messages && result.messages.length > 0) {
          console.log('📄 DOCX messages:', result.messages)
        }
        
        if (!result.value || result.value.trim().length === 0) {
          console.warn('⚠️ DOCX appears to be empty')
          throw new Error('DOCX file appears to be empty. Please upload a resume with content.')
        }
        
        return result.value
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError)
        throw new Error(`Failed to extract text from DOCX: ${docxError.message}`)
      }
    } else {
      throw new Error(`Please upload your resume in PDF or DOCX format only.`)
    }
  } catch (error) {
    console.error('Text extraction error:', error)
    throw new Error(`Failed to extract text from file: ${error.message}`)
  }
}