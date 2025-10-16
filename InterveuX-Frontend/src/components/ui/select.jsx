import React from 'react'

export const Select = ({ children, value, onValueChange }) => {
  // children: SelectTrigger, SelectContent
  return <div data-value={value}>{React.Children.map(children, child => child)}</div>
}

export const SelectTrigger = ({ children }) => <div className="border rounded px-3 py-2">{children}</div>

export const SelectValue = ({ children }) => <span>{children}</span>

export const SelectContent = ({ children }) => <div className="mt-1">{children}</div>

export const SelectItem = ({ children, value, onClick }) => (
  <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer" onClick={() => onClick && onClick(value)}>{children}</div>
)

export default Select
