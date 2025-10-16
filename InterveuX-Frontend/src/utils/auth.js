// Authentication utility functions
const TOKEN_KEY = 'intervuex_token'
const USER_KEY = 'intervuex_user'

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  
  try {
    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp > currentTime
  } catch {
    return false
  }
}

// Get current user data
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

// Store authentication data
export const setAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Get stored token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

// Login function - calls backend API and stores user data and token
import api from '../lib/api'

export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email, password: '***' })
    const response = await api.post('/api/auth/login', { email, password })
    console.log('Login response:', response.data)
    
    const { token, ...user } = response.data
    setAuthData(token, user)
    return { success: true, user, token }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message)
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed. Please check your connection.' 
    }
  }
}

// Register function - calls backend API and stores user data and token
export const register = async (name, email, password) => {
  try {
    console.log('Attempting registration with:', { name, email, password: '***' })
    const response = await api.post('/api/auth/register', { name, email, password })
    console.log('Registration response:', response.data)
    
    const { token, ...user } = response.data
    setAuthData(token, user)
    return { success: true, user, token }
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message)
    return { 
      success: false, 
      message: error.response?.data?.message || 'Registration failed. Please check your connection.' 
    }
  }
}

// Logout user
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Mock login function (for development)
export const mockLogin = (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email && password) {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk5doNm_7Vp_vjQFDLo3p7f7Rq_5tZZzKzE'
        const mockUser = {
          id: '1',
          name: 'John Doe',
          email: email,
          joinedAt: new Date().toISOString()
        }
        setAuthData(mockToken, mockUser)
        resolve({ success: true, user: mockUser, token: mockToken })
      } else {
        resolve({ success: false, message: 'Invalid credentials' })
      }
    }, 1000)
  })
}

// Mock register function (for development)
export const mockRegister = (name, email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (name && email && password) {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKwAk5doNm_7Vp_vjQFDLo3p7f7Rq_5tZZzKzE'
        const mockUser = {
          id: '1',
          name: name,
          email: email,
          joinedAt: new Date().toISOString()
        }
        setAuthData(mockToken, mockUser)
        resolve({ success: true, user: mockUser, token: mockToken })
      } else {
        resolve({ success: false, message: 'All fields are required' })
      }
    }, 1000)
  })
}