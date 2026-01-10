import React, { useState } from 'react'

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  theme?: 'light' | 'dark'
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex
}

export const Endpoint: React.FC<EndpointProps> = ({
  method,
  path,
  theme = 'light'
}) => {
  const [copied, setCopied] = useState(false)

  const methodColors: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#8b5cf6',
    DELETE: '#ef4444',
  }

  const getMethodColor = (method: string) => {
    const color = methodColors[method] || '#6b7280'
    const bgOpacity = theme === 'light' ? 0.1 : 0.15
    return { bg: hexToRgba(color, bgOpacity), text: color }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const color = getMethodColor(method)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '16px',
        backgroundColor: 'transparent',
      }}
    >
      <span
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          flexShrink: 0,
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {method}
      </span>
      <div
        style={{
          flex: 1,
          padding: '0.5rem 0.75rem',
          borderRadius: '12px',
          backgroundColor: 'transparent',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
        }}
      >
        {path}
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '0.5rem',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          outline: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title={copied ? 'Copied!' : 'Copy path'}
      >
        {copied ? (
          <svg
            style={{ width: '14px', height: '14px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            style={{ width: '14px', height: '14px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
