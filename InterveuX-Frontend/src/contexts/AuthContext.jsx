import { createContext, useContext, useEffect, useState } from 'react'
import { isAuthenticated, getUser } from '../utils/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const userData = getUser()
        setUser(userData)
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}