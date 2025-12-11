export interface Parameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  description?: string
  required?: boolean
  schema?: ApiSchema
  example?: any
  examples?: any
}

export interface ApiSchema {
  type?: string
  format?: string
  enum?: string[]
  items?: ApiSchema
  properties?: Record<string, ApiSchema>
  required?: string[]
  minimum?: number
  maximum?: number
  default?: any
  minLength?: number
  maxLength?: number
  pattern?: any
  example?: any
  multipleOf?: number
  uniqueItems?: any
  nullable?: boolean
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  description?: string
}

export interface ResponseSchema {
  description: string
  content?: {
    [mediaType: string]: {
      schema: ApiSchema
    }
  }
}

export interface RequestBody {
  description?: string
  required?: boolean
  content?: {
    [mediaType: string]: {
      schema: ApiSchema
    }
  }
}

export interface SecuritySchema {
  type?: string
  name?: string
  in?: string
  scheme?: string
  bearerFormat?: string
  description?: string
}

export interface ApiReferenceProps {
  title?: string
  summary?: string
  description?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path?: string
  deprecated?: boolean
  tags?: string[]
  externalDocs?: { url?: string; description?: string }
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Record<string, ResponseSchema>
  tryItBaseUrl?: string
  security?: any[]
  securitySchemas?: Record<string, SecuritySchema>
  operationId?: string
  version?: string
}
