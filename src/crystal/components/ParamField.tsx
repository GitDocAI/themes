import React from 'react'

interface ParamFieldProps {
  path: string
  type?: string
  required?: boolean
  description?: string
  theme?: 'light' | 'dark'
}

// Get type-specific colors (syntax highlighting style)
const getTypeColors = (type: string, theme: 'light' | 'dark') => {
  const typeColorMap: Record<string, { light: { bg: string; text: string }; dark: { bg: string; text: string } }> = {
    // String - Red/Orange (like string literals)
    string: {
      light: { bg: '#fee2e2', text: '#dc2626' },
      dark: { bg: '#450a0a', text: '#fca5a5' },
    },
    // Number/Integer - Blue (like numeric literals)
    number: {
      light: { bg: '#dbeafe', text: '#2563eb' },
      dark: { bg: '#1e3a8a', text: '#93c5fd' },
    },
    integer: {
      light: { bg: '#dbeafe', text: '#2563eb' },
      dark: { bg: '#1e3a8a', text: '#93c5fd' },
    },
    // Boolean - Purple/Magenta (like keywords true/false)
    boolean: {
      light: { bg: '#f3e8ff', text: '#9333ea' },
      dark: { bg: '#581c87', text: '#d8b4fe' },
    },
    // Object - Yellow/Gold (like object types)
    object: {
      light: { bg: '#fef3c7', text: '#d97706' },
      dark: { bg: '#78350f', text: '#fcd34d' },
    },
    // Array - Cyan/Teal (like array brackets)
    array: {
      light: { bg: '#cffafe', text: '#0891b2' },
      dark: { bg: '#164e63', text: '#67e8f9' },
    },
    // File - Green
    file: {
      light: { bg: '#dcfce7', text: '#16a34a' },
      dark: { bg: '#14532d', text: '#86efac' },
    },
  }

  const defaultColors = {
    light: { bg: '#f3f4f6', text: '#4b5563' },
    dark: { bg: '#374151', text: '#9ca3af' },
  }

  const colors = typeColorMap[type.toLowerCase()] || defaultColors
  return colors[theme]
}

export const ParamField: React.FC<ParamFieldProps> = ({
  path,
  type = 'string',
  required = false,
  description = '',
  theme = 'dark'
}) => {
  const colors = {
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    secondaryText: theme === 'light' ? '#6b7280' : '#9ca3af',
    pathText: theme === 'light' ? '#059669' : '#34d399', // Green color for path
    requiredBg: theme === 'light' ? '#fef3c7' : '#78350f',
    requiredText: theme === 'light' ? '#92400e' : '#fcd34d',
    requiredBorder: theme === 'light' ? '#fde68a' : '#b45309',
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
        {/* Parameter name - Green */}
        <span
          style={{
            fontWeight: '600',
            fontSize: '14px',
            color: colors.pathText,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          {path}
        </span>

        {/* Type - with background color based on type */}
        <span
          style={{
            fontSize: '12px',
            color: typeColors.text,
            backgroundColor: typeColors.bg,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {type}
        </span>

        {/* Required badge */}
        {required && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: colors.requiredText,
              backgroundColor: colors.requiredBg,
              border: `1px solid ${colors.requiredBorder}`,
              borderRadius: '4px',
              padding: '1px 6px',
            }}
          >
            required
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
    </div>
  )
}
