import React from 'react'
import type { ResponseSchema } from '../../../types/ApiReference'
import { ApiSchemaRenderer } from './ApiSchemaRenderer'

interface ResponseProps {
  responses: Record<string, ResponseSchema>
  theme?: 'light' | 'dark'
}

export const Response: React.FC<ResponseProps> = ({ responses, theme = 'light' }) => {
  if (!responses || Object.keys(responses).length === 0) {
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
        Responses
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(responses).map(([statusCode, responseSchema]) => {
          const contentType = responseSchema.content
            ? Object.keys(responseSchema.content)[0]
            : null
          const schema = contentType ? responseSchema.content?.[contentType]?.schema : null

          return (
            <div
              key={statusCode}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: statusCode.startsWith('2')
                        ? '#10b981'
                        : statusCode.startsWith('4')
                        ? '#f59e0b'
                        : statusCode.startsWith('5')
                        ? '#ef4444'
                        : 'var(--text-color)',
                    }}
                  >
                    {statusCode}
                  </span>
                  {responseSchema.description && (
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-color-secondary)',
                      }}
                    >
                      {responseSchema.description}
                    </span>
                  )}
                </div>

                {contentType && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {contentType}
                  </span>
                )}
              </div>

              {schema && schema.properties && (
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
              )}

              {schema && schema.type === 'array' && schema.items && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {schema.items.properties &&
                    Object.entries(schema.items.properties).map(([propName, propSchema]) => (
                      <ApiSchemaRenderer
                        key={propName}
                        name={propName}
                        schema={propSchema}
                        required={schema.items?.required?.includes(propName)}
                        theme={theme}
                      />
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
