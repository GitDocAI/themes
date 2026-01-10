import React, { useState } from 'react'
import type { ApiSchema } from '../../../types/ApiReference'

interface ApiSchemaRendererProps {
  name: string
  schema?: ApiSchema
  required?: boolean
  description?: string
  paramIn?: string
  parentPath?: string
  theme?: 'light' | 'dark'
}

export const ApiSchemaRenderer: React.FC<ApiSchemaRendererProps> = ({
  name,
  schema,
  required,
  description,
  paramIn,
  parentPath = '',
  theme = 'light',
}) => {
  const [expanded, setExpanded] = useState(false)

  if (!schema) return null

  const fullPath = parentPath ? `${parentPath}.${name}` : name
  const hasChildren = schema.properties || (schema.type === 'array' && schema.items?.properties)

  const renderType = () => {
    if (schema.format) {
      return `${schema.type}<${schema.format}>`
    }
    if (schema.type === 'array' && schema.items?.type) {
      return `${schema.items.type}[]`
    }
    return schema.type || 'any'
  }

  const renderConstraints = () => {
    const constraints: React.ReactNode[] = []

    if (schema.minimum !== undefined) {
      constraints.push(
        <span key="min" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Min: <strong>{schema.minimum}</strong>
        </span>
      )
    }
    if (schema.maximum !== undefined) {
      constraints.push(
        <span key="max" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Max: <strong>{schema.maximum}</strong>
        </span>
      )
    }
    if (schema.minLength !== undefined) {
      constraints.push(
        <span key="minLength" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Min Length: <strong>{schema.minLength}</strong>
        </span>
      )
    }
    if (schema.maxLength !== undefined) {
      constraints.push(
        <span key="maxLength" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Max Length: <strong>{schema.maxLength}</strong>
        </span>
      )
    }
    if (schema.pattern) {
      constraints.push(
        <span key="pattern" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Pattern: <code style={{ fontSize: '0.7rem' }}>{schema.pattern}</code>
        </span>
      )
    }
    if (schema.enum) {
      constraints.push(
        <div key="enum" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Enum:{' '}
          {schema.enum.map((val, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                margin: '0.125rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                fontSize: '0.7rem',
                color: theme === 'dark' ? '#e5e7eb' : '#374151',
              }}
            >
              {val}
            </span>
          ))}
        </div>
      )
    }
    if (schema.default !== undefined) {
      constraints.push(
        <span key="default" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Default: <strong>{JSON.stringify(schema.default)}</strong>
        </span>
      )
    }
    if (schema.example !== undefined) {
      constraints.push(
        <span key="example" style={{ fontSize: '0.75rem', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          Example: <strong>{JSON.stringify(schema.example)}</strong>
        </span>
      )
    }

    return constraints.length > 0 ? (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '0.5rem',
        }}
      >
        {constraints}
      </div>
    ) : null
  }

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: '16px',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontWeight: '500',
              color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '8px',
              backgroundColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
            }}
          >
            {name}
          </span>

          {paramIn && paramIn !== 'query' && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              {paramIn}
            </span>
          )}

          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '8px',
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              fontFamily: 'monospace',
            }}
          >
            {renderType()}
          </span>

          {required && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                color: '#ef4444',
                fontWeight: '500',
              }}
            >
              required
            </span>
          )}

          {schema.deprecated && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                fontWeight: '600',
              }}
            >
              deprecated
            </span>
          )}

          {schema.readOnly && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
              }}
            >
              read-only
            </span>
          )}

          {schema.writeOnly && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.125rem 0.5rem',
                borderRadius: '8px',
                backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
              }}
            >
              write-only
            </span>
          )}
        </div>

        {(description || schema.description) && (
          <p
            style={{
              fontSize: '0.875rem',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              margin: 0,
            }}
          >
            {description || schema.description}
          </p>
        )}

        {renderConstraints()}

        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--primary-color)',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <i className={`pi ${expanded ? 'pi-chevron-up' : 'pi-chevron-down'}`} style={{ fontSize: '0.7rem' }} />
            {expanded ? 'Hide' : 'Show'} properties
          </button>
        )}
      </div>

      {expanded && schema.properties && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {Object.entries(schema.properties).map(([childName, childSchema]) => (
            <ApiSchemaRenderer
              key={childName}
              name={childName}
              schema={childSchema}
              required={schema.required?.includes(childName)}
              parentPath={fullPath}
              theme={theme}
            />
          ))}
        </div>
      )}

      {expanded && schema.type === 'array' && schema.items?.properties && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {Object.entries(schema.items.properties).map(([childName, childSchema]) => (
            <ApiSchemaRenderer
              key={childName}
              name={childName}
              schema={childSchema}
              required={schema.items?.required?.includes(childName)}
              parentPath={`${fullPath}[]`}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}
