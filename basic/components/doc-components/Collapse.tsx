'use client'

import { ReactNode, useState } from 'react'
import { useTheme } from 'next-themes'
import { getPrimaryColorStyle } from '../../hooks/useThemeColors'

interface CollapseProps {
  children: ReactNode
  title?: string
  defaultOpen?: boolean
}

export const Collapse = ({ children, title = 'Details', defaultOpen = false }: CollapseProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const { resolvedTheme } = useTheme()
  const primaryColor = getPrimaryColorStyle(resolvedTheme)

  return (
    <div
      className="collapse-container my-4 border-l-[3px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftColor: primaryColor }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = primaryColor
        e.currentTarget.style.borderLeftColor = primaryColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.borderLeftColor = primaryColor
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapse-header w-full flex items-center gap-2 text-left group hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: primaryColor }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>
      </button>
      {isOpen && (
        <div className="collapse-content ml-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
          {children}
        </div>
      )}
    </div>
  )
}

export default Collapse
