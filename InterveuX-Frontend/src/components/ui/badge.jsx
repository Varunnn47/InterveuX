import React from 'react'

export const Badge = ({ children, className = '', variant = 'default', ...props }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-200 bg-white text-gray-800',
    secondary: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge
