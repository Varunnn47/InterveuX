import { useState } from 'react'
import api from '../lib/api'

const AuthDebug = () => {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/health')
      setStatus(`✅ Backend connected: ${response.data.message}`)
    } catch (error) {
      setStatus(`❌ Backend connection failed: ${error.message}`)
    }
    setLoading(false)
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'test123'
      })
      setStatus(`✅ Login endpoint working: ${response.data.message || 'Success'}`)
    } catch (error) {
      setStatus(`❌ Login test failed: ${error.response?.data?.message || error.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Panel</h3>
      <div className="space-y-2">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          Test Backend Connection
        </button>
        <button 
          onClick={testLogin}
          disabled={loading}
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          Test Login Endpoint
        </button>
      </div>
      {status && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          {status}
        </div>
      )}
    </div>
  )
}

export default AuthDebug