import React from 'react'
import type { ApiReferenceProps } from '../../types/ApiReference'
import { Parameters } from './api-reference/Parameters'
import { RequestBody } from './api-reference/RequestBody'
import { Response } from './api-reference/Response'
import { Authentication } from './api-reference/Authentication'
import { CodeGroup, CodeTab } from './CodeGroup'
import { Label } from './Label'
import { Endpoint } from './Endpoint'

interface OpenAPISchema {
  type?: string
  example?: any
  properties?: Record<string, OpenAPISchema>
  items?: OpenAPISchema
  [key: string]: any
}

interface OpenAPIResponseSchema {
  description?: string
  content?: {
    [contentType: string]: {
      schema?: OpenAPISchema
    }
  }
}

export const ApiReference: React.FC<ApiReferenceProps & { theme?: 'light' | 'dark' }> = ({
  title,
  summary,
  description,
  method,
  path,
  deprecated,
  tags,
  externalDocs,
  parameters = [],
  requestBody,
  responses = {},
  security,
  securitySchemas,
  theme = 'light',
}) => {
  // Generate response examples for CodeGroup
  const responseExamples = Object.entries(responses).map(([statusCode, responseSchema]: [string, OpenAPIResponseSchema]) => {
    const contentType = responseSchema.content ? Object.keys(responseSchema.content)[0] : 'application/json'
    const schema = responseSchema.content?.[contentType]?.schema

    // Generate example based on schema
    const generateExample = (sch: OpenAPISchema): any => {
      if (!sch) return {}
      if (sch.example) return sch.example
      if (sch.type === 'array' && sch.items) {
        return [generateExample(sch.items)]
      }
      if (sch.type === 'object' && sch.properties) {
        const obj: Record<string, any> = {}
        Object.entries(sch.properties).forEach(([key, prop]: [string, OpenAPISchema]) => {
          obj[key] = prop.example || generateExample(prop)
        })
        return obj
      }
      if (sch.type === 'string') return sch.example || 'string'
      if (sch.type === 'number' || sch.type === 'integer') return sch.example || 0
      if (sch.type === 'boolean') return sch.example || false
      return null
    }

    const example = schema ? generateExample(schema) : {}

    return {
      statusCode,
      description: responseSchema.description,
      example: JSON.stringify(example, null, 2),
    }
  })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 450px',
        gap: '3rem',
        width: '100%',
        maxWidth: '100%',
        margin: '0',
        padding: '0',
      }}
    >
      {/* Left Column - Main Content */}
      <div>
        {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Label key={tag} label={tag} color="#3b82f6" theme={theme} />
            ))}
          </div>
        )}

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            color: 'var(--text-color)',
          }}
        >
          {title || 'Untitled endpoint'}
        </h1>

        {(description || summary) && (
          <p
            style={{
              color: 'var(--text-color)',
              marginBottom: '1.5rem',
              lineHeight: '1.6',
            }}
          >
            {description || summary}
          </p>
        )}

        {deprecated && (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#dc2626',
              fontWeight: '600',
              marginBottom: '1rem',
            }}
          >
            ⚠️ Deprecated
          </p>
        )}

        {externalDocs?.url && (
          <a
            href={externalDocs.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'underline',
              fontSize: '0.875rem',
            }}
          >
            {externalDocs.description || 'External Documentation'}
          </a>
        )}
      </div>

      {/* Method and Path */}
      {(method && path) && (
        <div style={{ marginBottom: '2rem' }}>
          <Endpoint method={method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} path={path} theme={theme} />
        </div>
      )}

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Authentication security={security} securitySchemas={securitySchemas} theme={theme} />
          <Parameters parameters={parameters} theme={theme} />
          <RequestBody requestBody={requestBody} theme={theme} />
          <Response responses={responses} theme={theme} />
        </div>
      </div>

      {/* Right Column - Response Examples */}
      <div
        style={{
          position: 'sticky',
          top: '2rem',
          alignSelf: 'start',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'var(--text-color)',
          }}
        >
          Response Examples
        </h3>

        {responseExamples.length > 0 ? (
          <div style={{ outline: 'none', userSelect: 'text' }}>
            <CodeGroup theme={theme}>
              {responseExamples.map((resp) => (
                <CodeTab
                  key={resp.statusCode}
                  name={resp.statusCode}
                  lang="json"
                  code={resp.example}
                />
              ))}
            </CodeGroup>
          </div>
        ) : (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '8px',
              backgroundColor: 'var(--surface-100)',
              border: '1px solid var(--surface-300)',
              color: 'var(--text-color-secondary)',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            No response examples available
          </div>
        )}
      </div>
    </div>
  )
}
