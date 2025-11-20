import React from 'react'
import type { Parameter } from '../../types/ApiReference'
import { ApiSchemaRenderer } from './ApiSchemaRenderer'

interface ParametersProps {
  parameters: Parameter[]
  theme?: 'light' | 'dark'
}

export const Parameters: React.FC<ParametersProps> = ({ parameters, theme = 'light' }) => {
  if (!parameters || parameters.length === 0) {
    return null
  }

  const queryParams = parameters.filter((p) => p.in === 'query')
  const pathParams = parameters.filter((p) => p.in === 'path')
  const headerParams = parameters.filter((p) => p.in === 'header')
  const cookieParams = parameters.filter((p) => p.in === 'cookie')

  const renderParamSection = (title: string, params: Parameter[]) => {
    if (params.length === 0) return null

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
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {params.map((param) => (
            <ApiSchemaRenderer
              key={param.name}
              name={param.name}
              schema={param.schema}
              required={param.required}
              description={param.description}
              paramIn={param.in}
              theme={theme}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderParamSection('Path Parameters', pathParams)}
      {renderParamSection('Authentication', headerParams)}
      {renderParamSection('Query Parameters', queryParams)}
      {renderParamSection('Cookie Parameters', cookieParams)}
    </div>
  )
}
