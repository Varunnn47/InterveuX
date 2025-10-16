import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { dracula } from "@uiw/codemirror-theme-dracula";
import api from "../lib/api";

const CodingRound = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const getStarterCode = (language) => {
    const currentQ = selectedQuestions[currentQuestion];
    const functionName = currentQ?.functionName || 'solution';
    
    const templates = {
      javascript: `// Write your JavaScript solution here\n// Function name: ${functionName}\n\nfunction ${functionName}() {\n    // Your code here\n    console.log('Hello World');\n    return 'Hello World';\n}\n\n// Test your function\nconsole.log(${functionName}());`,
      python: `# Write your Python solution here\n# Function name: ${functionName}\n\ndef ${functionName}():\n    # Your code here\n    print('Hello World')\n    return 'Hello World'\n\n# Test your function\nprint(${functionName}())`,
      java: `// Write your Java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n        System.out.println("Hello World");\n    }\n}`,
      c: `// Write your C solution here\n#include <stdio.h>\n\nint main() {\n    // Your code here\n    printf("Hello World");\n    return 0;\n}`
    };
    return templates[language] || "";
  };

  useEffect(() => {
    setCode(getStarterCode("javascript"));
    fetchRandomQuestions();
    window.codingStartTime = Date.now(); // Track time for each question
  }, []);

  const fetchRandomQuestions = async () => {
    try {
      const response = await api.get('/api/coding/questions?count=5');
      setSelectedQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to local questions if API fails
      setSelectedQuestions(selectRandomQuestions());
    }
  };

  const allQuestions = [
    {
      id: 1,
      title: "Find Maximum Element (Easy)",
      difficulty: "Easy",
      description: "Write a function that finds the maximum element in an array of integers.",
      example: "Input: [3, 7, 2, 9, 1]\nOutput: 9",
      testCases: [
        { input: [3, 7, 2, 9, 1], expected: 9 },
        { input: [1, 2, 3, 4, 5], expected: 5 },
        { input: [-1, -5, -3], expected: -1 }
      ],
      functionName: "findMax"
    },
    {
      id: 2,
      title: "Reverse String (Easy)",
      difficulty: "Easy", 
      description: "Write a function that reverses a string without using built-in reverse methods.",
      example: "Input: 'hello'\nOutput: 'olleh'",
      testCases: [
        { input: "hello", expected: "olleh" },
        { input: "world", expected: "dlrow" },
        { input: "a", expected: "a" }
      ],
      functionName: "reverseString"
    },
    {
      id: 3,
      title: "Valid Parentheses (Medium)",
      difficulty: "Medium",
      description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      example: "Input: '({[]})'\nOutput: true\nInput: '([)]'\nOutput: false",
      testCases: [
        { input: "({[]})", expected: true },
        { input: "([)]", expected: false },
        { input: "()", expected: true }
      ],
      functionName: "isValidParentheses"
    },
    {
      id: 4,
      title: "Longest Substring Without Repeating Characters (Medium)",
      difficulty: "Medium",
      description: "Given a string, find the length of the longest substring without repeating characters.",
      example: "Input: 'abcabcbb'\nOutput: 3 (substring 'abc')",
      testCases: [
        { input: "abcabcbb", expected: 3 },
        { input: "bbbbb", expected: 1 },
        { input: "pwwkew", expected: 3 }
      ],
      functionName: "lengthOfLongestSubstring"
    },
    {
      id: 5,
      title: "Two Sum (Easy)",
      difficulty: "Easy",
      description: "Given an array of integers and a target sum, return indices of two numbers that add up to target.",
      example: "Input: [2,7,11,15], target = 9\nOutput: [0,1]",
      testCases: [
        { input: { nums: [2,7,11,15], target: 9 }, expected: [0,1] },
        { input: { nums: [3,2,4], target: 6 }, expected: [1,2] },
        { input: { nums: [3,3], target: 6 }, expected: [0,1] }
      ],
      functionName: "twoSum"
    },
    {
      id: 6,
      title: "Palindrome Check (Easy)",
      difficulty: "Easy",
      description: "Write a function to check if a given string is a palindrome.",
      example: "Input: 'racecar'\nOutput: true\nInput: 'hello'\nOutput: false"
    },
    {
      id: 7,
      title: "Binary Search (Medium)",
      difficulty: "Medium",
      description: "Implement binary search algorithm to find target element in sorted array.",
      example: "Input: [1,3,5,7,9], target = 5\nOutput: 2"
    },
    {
      id: 8,
      title: "Fibonacci Sequence (Easy)",
      difficulty: "Easy",
      description: "Write a function to generate the nth Fibonacci number.",
      example: "Input: n = 6\nOutput: 8 (sequence: 0,1,1,2,3,5,8)"
    },
    {
      id: 9,
      title: "Remove Duplicates (Medium)",
      difficulty: "Medium",
      description: "Remove duplicates from a sorted array in-place and return new length.",
      example: "Input: [1,1,2,2,3]\nOutput: 3, array becomes [1,2,3]"
    },
    {
      id: 10,
      title: "Merge Two Sorted Arrays (Medium)",
      difficulty: "Medium",
      description: "Merge two sorted arrays into one sorted array.",
      example: "Input: [1,3,5], [2,4,6]\nOutput: [1,2,3,4,5,6]"
    },
    {
      id: 11,
      title: "Count Vowels (Easy)",
      difficulty: "Easy",
      description: "Count the number of vowels in a given string.",
      example: "Input: 'hello world'\nOutput: 3"
    },
    {
      id: 12,
      title: "Prime Number Check (Medium)",
      difficulty: "Medium",
      description: "Write a function to check if a number is prime.",
      example: "Input: 17\nOutput: true\nInput: 15\nOutput: false"
    },
    {
      id: 13,
      title: "Array Rotation (Medium)",
      difficulty: "Medium",
      description: "Rotate an array to the right by k steps.",
      example: "Input: [1,2,3,4,5], k=2\nOutput: [4,5,1,2,3]"
    },
    {
      id: 14,
      title: "String Anagram (Easy)",
      difficulty: "Easy",
      description: "Check if two strings are anagrams of each other.",
      example: "Input: 'listen', 'silent'\nOutput: true"
    },
    {
      id: 15,
      title: "Find Missing Number (Medium)",
      difficulty: "Medium",
      description: "Find the missing number in an array containing n-1 numbers from 1 to n.",
      example: "Input: [1,2,4,5]\nOutput: 3"
    }
  ];

  // Function to randomly select 5 questions
  const selectRandomQuestions = () => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput("Please write some code first!");
      return;
    }

    setOutput("Running code...");
    
    try {
      // Use backend API for all languages
      const response = await api.post("/api/coding/execute", {
        code,
        language: selectedLanguage,
        testCases: currentQ?.testCases || [],
        questionTitle: currentQ?.title
      });

      const { results, score, totalTests, passedTests } = response.data;
      
      const logs = [];
      
      if (results && results.length > 0) {
        logs.push("=== Test Results ===");
        results.forEach((result, index) => {
          logs.push(`Test ${index + 1}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
          logs.push(`  Input: ${JSON.stringify(result.input)}`);
          logs.push(`  Expected: ${JSON.stringify(result.expected)}`);
          logs.push(`  Got: ${JSON.stringify(result.actual)}`);
          if (result.error) {
            logs.push(`  Error: ${result.error}`);
          }
          logs.push("");
        });
        
        logs.push(`🎯 Results: ${passedTests}/${totalTests} tests passed (${score}%)`);
        if (passedTests === totalTests) {
          logs.push("🎉 All tests passed! Great job!");
        } else {
          logs.push("💡 Some tests failed. Check your logic and try again.");
        }
      } else {
        // Just show execution output for simple runs
        logs.push("=== Code Output ===");
        logs.push(response.data.output || "Code executed successfully!");
      }
      
      setOutput(logs.join("\n"));
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`❌ Execution Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      alert("Please write some code before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('intervuex_token');
      if (!token) {
        alert('Please log in first');
        navigate('/login');
        return;
      }

      // Execute code and get AI feedback
      const executeResponse = await api.post("/api/coding/execute", {
        code,
        language: selectedLanguage,
        testCases: currentQ.testCases || [],
        questionTitle: currentQ.title
      });

      const { score, totalTests, passedTests, aiFeedback } = executeResponse.data;

      // Save with AI feedback
      await api.post("/api/coding/save", {
        question: currentQ.title,
        code,
        language: selectedLanguage,
        results: executeResponse.data.results || [],
        score,
        totalTests,
        passedTests,
        aiFeedback,
        timeSpent: Date.now() - (window.codingStartTime || Date.now())
      });

      if (currentQuestion < selectedQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setCode(getStarterCode(selectedLanguage));
        setOutput("");
        window.codingStartTime = Date.now();
      } else {
        // Show overall coding score at the end
        try {
          const statsResponse = await api.get('/api/coding/stats');
          const overallScore = statsResponse.data.averageScore || 0;
          alert(`🎉 Coding Round Complete!\n\n📊 Your Overall Coding Score: ${overallScore}%\n\nProceeding to Interview Round...`);
        } catch (error) {
          alert("🎉 Coding round completed! Proceeding to Interview Round...");
        }
        navigate("/interview");
      }
    } catch (error) {
      let errorMsg = "Failed to submit";
      if (error.response?.status === 401) {
        errorMsg = "Please log in again";
        navigate('/login');
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      alert(`Submission failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = selectedQuestions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">💻 Coding Round</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                if (!code.trim() || code === getStarterCode(selectedLanguage)) {
                  setCode(getStarterCode(e.target.value));
                }
              }}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
            <span className="text-sm bg-blue-100 px-3 py-1 rounded-full">
              Question {currentQuestion + 1} of {selectedQuestions.length}
            </span>
          </div>
        </div>

        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold">{currentQ.title}</h2>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              currentQ.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
              currentQ.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentQ.difficulty}
            </span>
          </div>
          <p className="text-gray-700 mb-2">{currentQ.description}</p>
          
          {currentQ.functionName && (
            <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400 mb-3">
              <strong>📝 Required Function Name:</strong>
              <code className="ml-2 bg-yellow-200 px-2 py-1 rounded text-sm">{currentQ.functionName}</code>
              <p className="text-sm text-yellow-700 mt-1">Make sure your function is named exactly as shown above.</p>
            </div>
          )}
          
          <div className="bg-white p-3 rounded border-l-4 border-blue-400">
            <strong>Example:</strong>
            <pre className="text-sm mt-1">{currentQ.example}</pre>
          </div>
        </div>

        <CodeMirror
          value={code}
          height="300px"
          theme={dracula}
          extensions={[
            selectedLanguage === 'javascript' ? javascript() :
            selectedLanguage === 'python' ? python() :
            selectedLanguage === 'java' ? java() : cpp()
          ]}
          onChange={(value) => setCode(value)}
          placeholder={`${selectedLanguage === 'python' ? '#' : '//'} Write your solution here...`}
        />

        <div className="flex gap-4 mt-4 flex-wrap">
          <button
            onClick={runCode}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            ▶ Run & Test
          </button>
          <button
            onClick={async () => {
              // Quick run without test cases
              if (!code.trim()) {
                setOutput("Please write some code first!");
                return;
              }
              
              setOutput("Running code...");
              
              try {
                const response = await api.post("/api/coding/execute", {
                  code,
                  language: selectedLanguage,
                  testCases: [], // No test cases for quick run
                  questionTitle: "Quick Test"
                });
                
                setOutput(response.data.output || "Code executed successfully!");
              } catch (error) {
                setOutput(`❌ Execution Error: ${error.response?.data?.error || error.message}`);
              }
            }}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            📝 Quick Run
          </button>
          <button
            onClick={submitCode}
            disabled={isSubmitting || !code.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : `Submit ${currentQuestion < selectedQuestions.length - 1 ? '& Next' : '& Finish'}`}
          </button>
          <button
            onClick={() => {
              setCode(getStarterCode(selectedLanguage));
              setOutput("");
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Reset
          </button>
        </div>

        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Output & Test Results:</h3>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm min-h-[100px] whitespace-pre-wrap">
            {output || "🤖 AI will analyze your code when you submit. Click 'Run & Test' to see results."}
          </div>
        </div>

        {currentQuestion === selectedQuestions.length - 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-800 mb-3">🎉 Ready for the final step!</p>
            <button
              onClick={() => navigate('/interview')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Interview Round →
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default CodingRound;
