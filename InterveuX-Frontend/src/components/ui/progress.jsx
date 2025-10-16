import React from 'react'

export const Progress = ({ value = 0, className = '', ...props }) => {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={`w-full bg-gray-200 rounded h-3 overflow-hidden ${className}`} {...props}>
      <div className="bg-blue-600 h-full" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default Progress
