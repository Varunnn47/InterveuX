import React from 'react'

export const Button = ({ children, className = '', variant = 'default', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium'
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  }
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
