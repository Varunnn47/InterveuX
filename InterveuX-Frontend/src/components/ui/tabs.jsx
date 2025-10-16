import React from 'react'

export const Tabs = ({ children, value, onValueChange }) => {
  // children expected: TabsList and TabsContent components
  return (
    <div data-value={value}>
      {React.Children.map(children, child => child)}
    </div>
  )
}

export const TabsList = ({ children, className = '' }) => (
  <div className={`flex gap-2 ${className}`}>{children}</div>
)

export const TabsTrigger = ({ children, value, className = '', onClick }) => (
  <button onClick={() => onClick ? onClick(value) : null} className={`px-2 py-1 rounded ${className}`} data-value={value}>{children}</button>
)

export const TabsContent = ({ children, value, className = '' }) => (
  <div data-value={value} className={className}>{children}</div>
)

export default Tabs
