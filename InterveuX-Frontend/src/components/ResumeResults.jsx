import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ResumeResults.css';

const ResumeResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysisResult } = location.state || {};

  if (!analysisResult) {
    navigate('/resume-analyzer');
    return null;
  }

  const handleNavigation = (path) => {
    navigate(path, { state: { analysisResult } });
  };

  return (
    <div className="resume-results">
      <div className="results-container">
        <h2>Resume Analysis Complete</h2>
        
        <div className="analysis-summary">
          <div className="score-section">
            <h3>Overall Score: {analysisResult.overallScore}/100</h3>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${analysisResult.overallScore}%` }}
              ></div>
            </div>
          </div>

          <div className="skills-section">
            <h4>Detected Skills:</h4>
            <div className="skills-list">
              {analysisResult.skills?.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>

          <div className="role-section">
            <h4>Suitable Job Roles:</h4>
            <ul>
              {analysisResult.suitableJobRoles?.map((role, index) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="navigation-section">
          <h3>Next Steps</h3>
          <p>Based on your resume analysis, choose your interview path:</p>
          
          <div className="nav-buttons">
            {analysisResult.isProgrammingRelated ? (
              <>
                <button 
                  className="nav-btn coding-btn"
                  onClick={() => handleNavigation('/coding-round')}
                >
                  <div className="btn-content">
                    <span className="btn-icon">💻</span>
                    <div>
                      <h4>Start Coding Round</h4>
                      <p>Technical coding assessment</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  className="nav-btn interview-btn"
                  onClick={() => handleNavigation('/interview')}
                >
                  <div className="btn-content">
                    <span className="btn-icon">🎤</span>
                    <div>
                      <h4>Skip to Interview</h4>
                      <p>Direct mock interview</p>
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <button 
                className="nav-btn interview-btn"
                onClick={() => handleNavigation('/interview')}
              >
                <div className="btn-content">
                  <span className="btn-icon">🎤</span>
                  <div>
                    <h4>Start Interview</h4>
                    <p>Mock interview session</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="additional-actions">
          <button 
            className="secondary-btn"
            onClick={() => navigate('/resume-analyzer')}
          >
            Upload Different Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeResults;