import React from 'react'

interface SimpleCardProps {
  title?: string
  subtitle?: string
  icon?: string
  children: React.ReactNode
  theme?: 'light' | 'dark'
}

export const SimpleCard: React.FC<SimpleCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  theme = 'light',
}) => {
  const iconClassName = icon
    ? (icon.startsWith('pi ') || icon.startsWith('pi-') ? icon : `pi ${icon}`)
    : undefined

  return (
    <div
      style={{
        margin: '20px 0',
        padding: '24px',
        backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
        border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {iconClassName && (
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <i className={iconClassName} style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
        </div>
      )}

      {title && (
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: theme === 'light' ? '#111827' : '#f9fafb',
        }}>
          {title}
        </h3>
      )}

      {subtitle && (
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '0.875rem',
          color: theme === 'light' ? '#6b7280' : '#9ca3af',
        }}>
          {subtitle}
        </p>
      )}

      <div style={{
        color: theme === 'light' ? '#374151' : '#d1d5db',
        lineHeight: '1.6',
      }}>
        {children}
      </div>
    </div>
  )
}
