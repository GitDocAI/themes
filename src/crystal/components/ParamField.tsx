import React from 'react'

interface ParamFieldProps {
  path: string
  type?: string
  required?: boolean
  default?: string
  description?: string
  theme?: 'light' | 'dark'
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
