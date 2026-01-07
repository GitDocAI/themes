import React from 'react'

interface LabelProps {
  label: string
  color?: string
  theme?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export const Label: React.FC<LabelProps> = ({
  label,
  color = '#3b82f6',
  theme = 'light',
  size = 'md'
}) => {
  const sizes = {
    sm: {
      padding: '0.125rem 0.5rem',
      fontSize: '0.625rem',
    },
    md: {
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
    },
    lg: {
      padding: '0.375rem 1rem',
      fontSize: '0.875rem',
    },
  }

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '4px',
        fontWeight: '500',
        backgroundColor: color,
        color: theme === 'light' ? '#000000' : '#ffffff',
        border: `1px solid ${color}`,
        ...sizes[size],
      }}
    >
      {label}
    </span>
  )
}
