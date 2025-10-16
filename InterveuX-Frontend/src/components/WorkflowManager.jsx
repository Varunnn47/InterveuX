import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const WorkflowManager = () => {
  const [currentStep, setCurrentStep] = useState('resume');
  const [workflowData, setWorkflowData] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const step = location.state?.step || 'resume';
    const data = location.state?.data || {};
    setCurrentStep(step);
    setWorkflowData(data);
  }, [location]);

  const handleStepComplete = (stepData) => {
    const updatedData = { ...workflowData, [currentStep]: stepData };
    setWorkflowData(updatedData);

    switch (currentStep) {
      case 'resume':
        setCurrentStep('coding');
        navigate('/coding', { state: { step: 'coding', data: updatedData } });
        break;
      case 'coding':
        setCurrentStep('interview');
        navigate('/interview', { state: { step: 'interview', data: updatedData } });
        break;
      case 'interview':
        navigate('/final-results', { state: { data: updatedData } });
        break;
    }
  };

  const steps = [
    { id: 'resume', name: 'Resume Analysis', completed: workflowData.resume },
    { id: 'coding', name: 'Coding Round', completed: workflowData.coding },
    { id: 'interview', name: 'Interview Round', completed: workflowData.interview }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Interview Process</h2>
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  step.completed ? 'bg-green-500' : 
                  step.id === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 ${step.id === currentStep ? 'font-semibold' : ''}`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 'resume' && (
            <ResumeStep onComplete={handleStepComplete} />
          )}
          {currentStep === 'coding' && (
            <CodingStep onComplete={handleStepComplete} data={workflowData} />
          )}
          {currentStep === 'interview' && (
            <InterviewStep onComplete={handleStepComplete} data={workflowData} />
          )}
        </div>
      </div>
    </div>
  );
};

const ResumeStep = ({ onComplete }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-4">Step 1: Resume Analysis</h3>
      <p className="text-gray-600 mb-6">Upload and analyze your resume to proceed to coding round</p>
      <button
        onClick={() => navigate('/resume')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start Resume Analysis
      </button>
    </div>
  );
};

const CodingStep = ({ onComplete, data }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-4">Step 2: Coding Round</h3>
      <p className="text-gray-600 mb-6">Complete coding challenges based on your resume analysis</p>
      <button
        onClick={() => navigate('/coding')}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Start Coding Round
      </button>
    </div>
  );
};

const InterviewStep = ({ onComplete, data }) => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-4">Step 3: Interview Round</h3>
      <p className="text-gray-600 mb-6">Final interview based on your resume and coding performance</p>
      <button
        onClick={() => navigate('/interview')}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Start Interview Round
      </button>
    </div>
  );
};

export default WorkflowManager;