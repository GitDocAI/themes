import React from 'react'
import type { RequestBody as RequestBodyType } from '../../../types/ApiReference'
import { ApiSchemaRenderer } from './ApiSchemaRenderer'

interface RequestBodyProps {
  requestBody?: RequestBodyType
  theme?: 'light' | 'dark'
}

export const RequestBody: React.FC<RequestBodyProps> = ({ requestBody, theme = 'light' }) => {
  if (!requestBody || !requestBody.content) {
    return null
  }

  const contentType = Object.keys(requestBody.content)[0]
  const schema = requestBody.content[contentType]?.schema

  if (!schema || !schema.properties) {
    return null
  }

  return (
    <div>
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: 'var(--text-color)',
        }}
      >
        Request Body
      </h3>

      <div
        style={{
          padding: '1rem',
          borderRadius: '16px',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'transparent',
        }}
      >
        {requestBody.description && (
          <p
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {requestBody.description}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '8px',
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            {contentType}
          </span>
          {requestBody.required && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                color: '#ef4444',
                fontWeight: '600',
              }}
            >
              required
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(schema.properties).map(([propName, propSchema]) => (
            <ApiSchemaRenderer
              key={propName}
              name={propName}
              schema={propSchema}
              required={schema.required?.includes(propName)}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
