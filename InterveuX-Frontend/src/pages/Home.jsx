import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, Target, Code, BarChart3, ArrowRight, CheckCircle } from 'lucide-react'
import { fadeInUp, staggerContainer } from '../utils/motion'

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI Resume Analysis',
      description: 'Get detailed feedback on your resume with AI-powered insights and improvement suggestions.'
    },
    {
      icon: Target,
      title: 'Mock Interviews',
      description: 'Practice with AI interviewer asking HR and technical questions based on your resume.'
    },
    {
      icon: Code,
      title: 'Coding Challenges',
      description: 'Solve programming problems in real-time with instant feedback and execution.'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed reports and personalized improvement recommendations.'
    }
  ]

  const benefits = [
    'Personalized AI feedback',
    'Real-time interview practice',
    'Comprehensive skill assessment',
    'Progress tracking dashboard'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="bg-gradient-to-br from-primary to-primary-dark text-white py-20 px-4"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            variants={fadeInUp}
            className="font-heading text-5xl md:text-6xl font-bold mb-6"
          >
            Master Your Next Interview with
            <span className="block text-cyan-300 mt-2">AI-Powered Practice</span>
          </motion.h1>
          
          <motion.p 
            variants={fadeInUp}
            className="font-body text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto"
          >
            IntervueX helps you prepare for interviews with AI-driven resume analysis, 
            mock interviews, and coding challenges tailored to your profile.
          </motion.p>
          
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link 
              to="/register"
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              to="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Ace Your Interview
            </h2>
            <p className="font-body text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines AI technology with proven interview techniques
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="py-20 px-4 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeInUp}>
              <h2 className="font-heading text-4xl font-bold text-gray-900 mb-6">
                Why Choose IntervueX?
              </h2>
              <p className="font-body text-lg text-gray-600 mb-8">
                Join thousands of candidates who have improved their interview skills 
                and landed their dream jobs with our AI-powered platform.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="font-body text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              className="bg-white p-8 rounded-2xl shadow-lg"
            >
              <div className="text-center">
                <div className="bg-primary text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-10 w-10" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                  Ready to Get Started?
                </h3>
                <p className="font-body text-gray-600 mb-6">
                  Create your account and start practicing with AI-powered interviews today.
                </p>
                <Link 
                  to="/register"
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors inline-flex items-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default Home