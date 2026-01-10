import React from 'react'

interface ParamFieldProps {
  path: string
  type?: string
  required?: boolean
  default?: string
  description?: string
  theme?: 'light' | 'dark'
}

// Get type-specific colors with transparent backgrounds
const getTypeColors = (type: string, theme: 'light' | 'dark') => {
  const typeColorMap: Record<string, { light: { bg: string; text: string }; dark: { bg: string; text: string } }> = {
    // String - Orange
    string: {
      light: { bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c' },
      dark: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' },
    },
    // Number/Integer - Blue
    number: {
      light: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
      dark: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa' },
    },
    integer: {
      light: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb' },
      dark: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa' },
    },
    // Boolean - Purple
    boolean: {
      light: { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea' },
      dark: { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc' },
    },
    // Object - Yellow
    object: {
      light: { bg: 'rgba(217, 119, 6, 0.1)', text: '#d97706' },
      dark: { bg: 'rgba(252, 211, 77, 0.15)', text: '#fcd34d' },
    },
    // Array - Cyan
    array: {
      light: { bg: 'rgba(8, 145, 178, 0.1)', text: '#0891b2' },
      dark: { bg: 'rgba(103, 232, 249, 0.15)', text: '#67e8f9' },
    },
    // File - Green
    file: {
      light: { bg: 'rgba(22, 163, 74, 0.1)', text: '#16a34a' },
      dark: { bg: 'rgba(134, 239, 172, 0.15)', text: '#86efac' },
    },
  }

  const defaultColors = {
    light: { bg: 'rgba(0, 0, 0, 0.06)', text: '#6b7280' },
    dark: { bg: 'rgba(255, 255, 255, 0.08)', text: '#9ca3af' },
  }

  const colors = typeColorMap[type.toLowerCase()] || defaultColors
  return colors[theme]
}

export const ParamField: React.FC<ParamFieldProps> = ({
  path,
  type = 'string',
  required = false,
  default: defaultValue,
  description = '',
  theme = 'dark'
}) => {
  const colors = {
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    secondaryText: theme === 'light' ? '#6b7280' : '#9ca3af',
    pathText: theme === 'light' ? '#3b82f6' : '#60a5fa', // Blue color for path
    pathBg: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.15)',
    requiredBg: theme === 'light' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(239, 68, 68, 0.15)',
    requiredText: theme === 'light' ? '#dc2626' : '#f87171',
  }

  const typeColors = getTypeColors(type, theme)

  return (
    <div
      style={{
        paddingTop: '4px',
        paddingBottom: '8px',
      }}
    >
      {/* Header: path, type, required badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}
      >
        {/* Parameter name - Blue */}
        <span
          style={{
            fontWeight: '500',
            fontSize: '13px',
            color: colors.pathText,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          {path}
        </span>

        {/* Type - with transparent background */}
        <span
          style={{
            fontWeight: '500',
            fontSize: '13px',
            color: theme === 'dark' ? '#e5e7eb' : '#4b5563',
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {type}
        </span>

        {/* Required badge - Red */}
        {required && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#f87171',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            required
          </span>
        )}

        {/* Default value */}
        {defaultValue !== undefined && defaultValue !== '' && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: '500',
              color: theme === 'dark' ? '#e5e7eb' : '#4b5563',
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            }}
          >
            <span style={{ opacity: 0.6 }}>default:</span> "{defaultValue}"
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: colors.secondaryText,
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      )}

      {/* Separator */}
      <hr
        style={{
          width: '100%',
          border: 'none',
          borderTop: `1px solid ${colors.border}`,
          margin: '16px 0 0 0',
          opacity: 0.5,
        }}
      />
    </div>
  )
}
