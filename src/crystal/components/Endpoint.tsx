import React, { useState } from 'react'

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  theme?: 'light' | 'dark'
}

export const Endpoint: React.FC<EndpointProps> = ({
  method,
  path,
  theme = 'light'
}) => {
  const [copied, setCopied] = useState(false)

  const methodColors: Record<string, { bg: string; text: string; bgDark: string; textDark: string }> = {
    GET: { bg: '#d1fae5', text: '#065f46', bgDark: '#064e3b', textDark: '#6ee7b7' },
    POST: { bg: '#dbeafe', text: '#1e40af', bgDark: '#1e3a8a', textDark: '#93c5fd' },
    PUT: { bg: '#fef3c7', text: '#92400e', bgDark: '#78350f', textDark: '#fcd34d' },
    PATCH: { bg: '#fef3c7', text: '#92400e', bgDark: '#78350f', textDark: '#fcd34d' },
    DELETE: { bg: '#ffe4e6', text: '#9f1239', bgDark: '#881337', textDark: '#fda4af' },
  }

  const getMethodColor = (method: string) => {
    const colors = methodColors[method]
    if (!colors) return { bg: '#e5e7eb', text: '#374151' }
    return theme === 'dark' ? { bg: colors.bgDark, text: colors.textDark } : { bg: colors.bg, text: colors.text }
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
        padding: '0.5rem',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: '8px',
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
      }}
    >
      <span
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
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
          borderRadius: '6px',
          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
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
