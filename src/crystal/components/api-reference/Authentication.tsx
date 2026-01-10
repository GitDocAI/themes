import React from 'react'
import type { SecuritySchema } from '../../../types/ApiReference'

interface AuthenticationProps {
  security?: any[]
  securitySchemas?: Record<string, SecuritySchema>
  theme?: 'light' | 'dark'
}

export const Authentication: React.FC<AuthenticationProps> = ({ security, securitySchemas, theme = 'light' }) => {
  if (!security || !securitySchemas || security.length === 0) {
    return null
  }

  // Get all security requirements
  const authMethods: { name: string; schema: SecuritySchema }[] = []

  security.forEach((securityReq) => {
    Object.keys(securityReq).forEach((key) => {
      if (securitySchemas[key]) {
        authMethods.push({
          name: key,
          schema: securitySchemas[key]
        })
      }
    })
  })

  if (authMethods.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: 'var(--text-color)',
        }}
      >
        Authentication
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {authMethods.map((auth, index) => {
          const { schema } = auth
          let authLabel = ''
          let authValue = ''

          if (schema.type === 'http' && schema.scheme === 'bearer') {
            authLabel = 'Authorization'
            authValue = `Bearer <${schema.bearerFormat || 'token'}>`
          } else if (schema.type === 'apiKey') {
            authLabel = schema.name || 'API Key'
            authValue = '<api_key>'
          }

          return (
            <div
              key={index}
              style={{
                padding: '1rem',
                borderRadius: '16px',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                backgroundColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: theme === 'dark' ? '#e5e7eb' : '#374151',
                    }}
                  >
                    {authLabel}
                  </span>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.625rem',
                      borderRadius: '8px',
                      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      fontWeight: '500',
                    }}
                  >
                    {schema.in || 'header'}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {authValue}
                </div>
                {schema.description && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      margin: 0,
                      marginTop: '0.25rem',
                    }}
                  >
                    {schema.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
