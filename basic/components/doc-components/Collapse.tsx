'use client'

import { ReactNode, useState } from 'react'

interface CollapseProps {
  children: ReactNode
  title?: string
  defaultOpen?: boolean
}

export const Collapse = ({ children, title = 'Details', defaultOpen = false }: CollapseProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="collapse-container my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapse-header w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="collapse-content px-4 py-3 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  )
}

export default Collapse
