import PDFDocument from 'pdfkit';
import User from '../models/User.js';
import InterviewHistory from '../models/InterviewHistory.js';
import CodingHistory from '../models/CodingHistory.js';

const generatePerformanceReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query;
    
    const user = await User.findById(userId);
    const interviews = await InterviewHistory.find({ 
      userId, 
      createdAt: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
    });
    const codingSessions = await CodingHistory.find({ 
      userId, 
      createdAt: { $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000) }
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=performance-report.pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Performance Report', 50, 50);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.text(`User: ${user.name}`, 50, 100);
    doc.text(`Period: Last ${timeRange} days`, 50, 120);

    // Interview Performance
    doc.fontSize(16).text('Interview Performance', 50, 160);
    const avgScore = interviews.reduce((sum, i) => sum + i.overallScore, 0) / interviews.length || 0;
    doc.fontSize(12).text(`Total Interviews: ${interviews.length}`, 70, 190);
    doc.text(`Average Score: ${avgScore.toFixed(1)}%`, 70, 210);
    
    // Coding Performance
    doc.fontSize(16).text('Coding Performance', 50, 250);
    const codingAvg = codingSessions.reduce((sum, c) => sum + c.score, 0) / codingSessions.length || 0;
    doc.text(`Total Sessions: ${codingSessions.length}`, 70, 280);
    doc.text(`Average Score: ${codingAvg.toFixed(1)}%`, 70, 300);

    // Recommendations
    doc.fontSize(16).text('Recommendations', 50, 340);
    const recommendations = generateRecommendations(interviews, codingSessions);
    recommendations.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 70, 370 + index * 20);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateRecommendations = (interviews, codingSessions) => {
  const recommendations = [];
  
  if (interviews.length > 0) {
    const avgScore = interviews.reduce((sum, i) => sum + i.overallScore, 0) / interviews.length;
    if (avgScore < 70) {
      recommendations.push('Focus on improving communication skills and technical explanations');
    }
  }
  
  if (codingSessions.length > 0) {
    const avgCoding = codingSessions.reduce((sum, c) => sum + c.score, 0) / codingSessions.length;
    if (avgCoding < 70) {
      recommendations.push('Practice more coding problems, especially data structures and algorithms');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Keep up the excellent work! Continue practicing regularly.');
  }
  
  return recommendations;
};

export {
  generatePerformanceReport
};