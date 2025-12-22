/**
 * OpenAPI/Swagger Parser Service
 * Parses OpenAPI 3.x and Swagger 2.0 files and converts them to our internal format
 * Browser-compatible implementation (no Node.js dependencies)
 */

import type {
  ApiReferenceProps,
  Parameter,
  RequestBody,
  ResponseSchema,
  ApiSchema,
  SecuritySchema
} from '../types/ApiReference'

// OpenAPI types (simplified)
interface OpenAPIDocument {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  host?: string // Swagger 2.0
  basePath?: string // Swagger 2.0
  schemes?: string[] // Swagger 2.0
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  securityDefinitions?: Record<string, any> // Swagger 2.0
  security?: any[] // Global security requirements
  tags?: Array<{ name: string; description?: string }>
}

interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  patch?: Operation
  delete?: Operation
  parameters?: any[]
}

interface Operation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  parameters?: any[]
  requestBody?: any
  responses?: Record<string, any>
  security?: any[]
  externalDocs?: { url?: string; description?: string }
}

// Navigation item for sidebar
export interface OpenAPINavigationItem {
  type: 'page' | 'group'
  title: string
  page?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  children?: OpenAPINavigationItem[]
}

// Parsed result
export interface ParsedOpenAPI {
  info: {
    title: string
    version: string
    description?: string
  }
  baseUrl: string
  endpoints: ApiReferenceProps[]
  navigation: OpenAPINavigationItem[]
  securitySchemas: Record<string, SecuritySchema>
  tags: Array<{ name: string; description?: string }>
}

class OpenAPIParserService {
  private cache: Map<string, ParsedOpenAPI> = new Map()

  /**
   * Resolve $ref references in the document
   * This is a simple implementation that handles local references (#/components/schemas/...)
   * Includes circular reference detection to prevent infinite loops
   */
  private resolveRefs(doc: OpenAPIDocument): OpenAPIDocument {
    // Cache for resolved refs to handle circular references
    const resolvedCache = new Map<string, any>()
    // Track refs currently being resolved to detect cycles
    const resolving = new Set<string>()

    const resolveRef = (obj: any, root: any, depth: number = 0): any => {
      // Prevent excessive depth
      if (depth > 50) {
        return obj
      }

      if (obj === null || obj === undefined) return obj
      if (typeof obj !== 'object') return obj

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => resolveRef(item, root, depth + 1))
      }

      // Check for $ref
      if (obj.$ref && typeof obj.$ref === 'string') {
        const refPath = obj.$ref

        // Check if already resolved (use cached version)
        if (resolvedCache.has(refPath)) {
          return resolvedCache.get(refPath)
        }

        // Check for circular reference
        if (resolving.has(refPath)) {
          // Return a placeholder for circular refs
          return { $circularRef: refPath }
        }

        if (refPath.startsWith('#/')) {
          // Mark as being resolved
          resolving.add(refPath)

          // Local reference - resolve it
          const parts = refPath.slice(2).split('/')
          let resolved = root
          for (const part of parts) {
            resolved = resolved?.[part]
            if (resolved === undefined) {
              console.warn(`[OpenAPIParser] Could not resolve $ref: ${refPath}`)
              resolving.delete(refPath)
              return obj // Return original if can't resolve
            }
          }

          // Create a shallow copy and resolve nested refs
          const result = resolveRef({ ...resolved }, root, depth + 1)

          // Cache the result
          resolvedCache.set(refPath, result)
          resolving.delete(refPath)

          return result
        }
        // External references not supported - return as is
        return obj
      }

      // Process all properties
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = resolveRef(value, root, depth + 1)
      }
      return result
    }

    return resolveRef(doc, doc, 0) as OpenAPIDocument
  }

  /**
   * Parse an OpenAPI/Swagger document from object
   * Note: $ref references should be resolved before calling this method
   */
  async parse(specObject: object): Promise<ParsedOpenAPI> {
    // Check cache
    const cacheKey = JSON.stringify(specObject)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // Cast to OpenAPIDocument - the spec should already be dereferenced
      const api = this.resolveRefs(specObject as OpenAPIDocument)

      const isSwagger2 = !!api.swagger

      console.log(`[OpenAPIParser] Detected ${isSwagger2 ? 'Swagger 2.0' : 'OpenAPI ' + api.openapi}`)

      // Extract base URL
      const baseUrl = this.extractBaseUrl(api)

      // Extract security schemas
      const securitySchemas = this.extractSecuritySchemas(api, isSwagger2)

      // Extract tags
      const tags = api.tags || []

      // Parse all endpoints
      const endpoints = this.parseEndpoints(api, baseUrl, securitySchemas, isSwagger2)

      // Generate navigation structure
      const navigation = this.generateNavigation(endpoints, tags)

      const result: ParsedOpenAPI = {
        info: {
          title: api.info.title,
          version: api.info.version,
          description: api.info.description
        },
        baseUrl,
        endpoints,
        navigation,
        securitySchemas,
        tags
      }

      // Cache the result
      this.cache.set(cacheKey, result)

      return result
    } catch (error) {
      console.error('[OpenAPIParser] Error parsing spec:', error)
      throw error
    }
  }

  /**
   * Extract base URL from spec
   */
  private extractBaseUrl(api: OpenAPIDocument): string {
    if (api.servers && api.servers.length > 0) {
      // OpenAPI 3.x
      return api.servers[0].url
    } else if (api.host) {
      // Swagger 2.0
      const scheme = api.schemes?.[0] || 'https'
      const basePath = api.basePath || ''
      return `${scheme}://${api.host}${basePath}`
    }
    return ''
  }

  /**
   * Extract security schemas from spec
   */
  private extractSecuritySchemas(api: OpenAPIDocument, isSwagger2: boolean): Record<string, SecuritySchema> {
    const schemas: Record<string, SecuritySchema> = {}
    const source = isSwagger2 ? api.securityDefinitions : api.components?.securitySchemes

    if (source) {
      for (const [name, schema] of Object.entries(source)) {
        schemas[name] = {
          type: schema.type,
          name: schema.name,
          in: schema.in,
          scheme: schema.scheme,
          bearerFormat: schema.bearerFormat,
          description: schema.description
        }
      }
    }

    return schemas
  }

  /**
   * Parse all endpoints from paths
   */
  private parseEndpoints(
    api: OpenAPIDocument,
    baseUrl: string,
    securitySchemas: Record<string, SecuritySchema>,
    isSwagger2: boolean
  ): ApiReferenceProps[] {
    const endpoints: ApiReferenceProps[] = []
    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const
    // Get global security (applies to all operations unless overridden)
    const globalSecurity = api.security

    for (const [path, pathItem] of Object.entries(api.paths)) {
      // Get path-level parameters
      const pathParameters = pathItem.parameters || []

      for (const method of methods) {
        const operation = pathItem[method]
        if (!operation) continue

        const endpoint = this.parseOperation(
          path,
          method.toUpperCase() as ApiReferenceProps['method'],
          operation,
          pathParameters,
          baseUrl,
          securitySchemas,
          isSwagger2,
          globalSecurity
        )

        endpoints.push(endpoint)
      }
    }

    return endpoints
  }

  /**
   * Parse a single operation
   */
  private parseOperation(
    path: string,
    method: ApiReferenceProps['method'],
    operation: Operation,
    pathParameters: any[],
    baseUrl: string,
    securitySchemas: Record<string, SecuritySchema>,
    isSwagger2: boolean,
    globalSecurity?: any[]
  ): ApiReferenceProps {
    // Merge path-level and operation-level parameters
    const allParameters = [...pathParameters, ...(operation.parameters || [])]

    // Parse parameters
    const parameters = this.parseParameters(allParameters, isSwagger2)

    // Parse request body
    const requestBody = this.parseRequestBody(operation, allParameters, isSwagger2)

    // Parse responses
    const responses = this.parseResponses(operation.responses || {}, isSwagger2)

    // Generate title from operationId or path
    const title = operation.summary || operation.operationId || `${method} ${path}`

    // Use operation-level security if defined, otherwise use global security
    // Note: operation.security = [] means explicitly no security (override global)
    // operation.security = undefined means inherit from global
    const security = operation.security !== undefined ? operation.security : globalSecurity

    return {
      title,
      summary: operation.summary,
      description: operation.description,
      method,
      path,
      deprecated: operation.deprecated || false,
      tags: operation.tags || ['default'],
      externalDocs: operation.externalDocs,
      parameters,
      requestBody,
      responses,
      tryItBaseUrl: baseUrl,
      security,
      securitySchemas,
      operationId: operation.operationId
    }
  }

  /**
   * Parse parameters
   */
  private parseParameters(params: any[], isSwagger2: boolean): Parameter[] {
    return params
      .filter(p => p.in !== 'body') // Body params are handled separately
      .map(p => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required || false,
        schema: isSwagger2 ? this.convertSwagger2Schema(p) : (p.schema || {}),
        example: p.example,
        examples: p.examples
      }))
  }

  /**
   * Parse request body (different for Swagger 2.0 vs OpenAPI 3.x)
   */
  private parseRequestBody(operation: Operation, params: any[], isSwagger2: boolean): RequestBody | undefined {
    if (isSwagger2) {
      // Swagger 2.0: body is a parameter with in: 'body'
      const bodyParam = params.find(p => p.in === 'body')
      if (bodyParam) {
        return {
          description: bodyParam.description,
          required: bodyParam.required,
          content: {
            'application/json': {
              schema: this.convertSchema(bodyParam.schema || {})
            }
          }
        }
      }
      return undefined
    } else {
      // OpenAPI 3.x: requestBody is separate
      if (!operation.requestBody) return undefined

      return {
        description: operation.requestBody.description,
        required: operation.requestBody.required,
        content: this.parseContent(operation.requestBody.content || {})
      }
    }
  }

  /**
   * Parse responses
   */
  private parseResponses(responses: Record<string, any>, isSwagger2: boolean): Record<string, ResponseSchema> {
    const result: Record<string, ResponseSchema> = {}

    for (const [statusCode, response] of Object.entries(responses)) {
      if (isSwagger2) {
        // Swagger 2.0
        result[statusCode] = {
          description: response.description || '',
          content: response.schema ? {
            'application/json': {
              schema: this.convertSchema(response.schema)
            }
          } : undefined
        }
      } else {
        // OpenAPI 3.x
        result[statusCode] = {
          description: response.description || '',
          content: response.content ? this.parseContent(response.content) : undefined
        }
      }
    }

    return result
  }

  /**
   * Parse content object (media types)
   */
  private parseContent(content: Record<string, any>): Record<string, { schema: ApiSchema }> {
    const result: Record<string, { schema: ApiSchema }> = {}

    for (const [mediaType, mediaContent] of Object.entries(content)) {
      result[mediaType] = {
        schema: this.convertSchema(mediaContent.schema || {})
      }
    }

    return result
  }

  /**
   * Convert Swagger 2.0 parameter schema
   */
  private convertSwagger2Schema(param: any): ApiSchema {
    return {
      type: param.type,
      format: param.format,
      enum: param.enum,
      minimum: param.minimum,
      maximum: param.maximum,
      minLength: param.minLength,
      maxLength: param.maxLength,
      pattern: param.pattern,
      default: param.default,
      example: param.example || param['x-example']
    }
  }

  /**
   * Convert schema to our format
   */
  private convertSchema(schema: any): ApiSchema {
    if (!schema) return {}

    const result: ApiSchema = {
      type: schema.type,
      format: schema.format,
      enum: schema.enum,
      minimum: schema.minimum,
      maximum: schema.maximum,
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
      default: schema.default,
      example: schema.example,
      multipleOf: schema.multipleOf,
      uniqueItems: schema.uniqueItems,
      nullable: schema.nullable,
      deprecated: schema.deprecated,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      description: schema.description,
      required: schema.required
    }

    // Handle array items
    if (schema.items) {
      result.items = this.convertSchema(schema.items)
    }

    // Handle object properties
    if (schema.properties) {
      result.properties = {}
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        result.properties[propName] = this.convertSchema(propSchema)
      }
    }

    return result
  }

  /**
   * Generate navigation structure from endpoints
   */
  private generateNavigation(
    endpoints: ApiReferenceProps[],
    tags: Array<{ name: string; description?: string }>
  ): OpenAPINavigationItem[] {
    // Group endpoints by first tag
    const groups: Map<string, ApiReferenceProps[]> = new Map()

    for (const endpoint of endpoints) {
      const tag = endpoint.tags?.[0] || 'default'
      if (!groups.has(tag)) {
        groups.set(tag, [])
      }
      groups.get(tag)!.push(endpoint)
    }

    // Create navigation structure
    const navigation: OpenAPINavigationItem[] = []

    // Sort groups by tag order in spec, then alphabetically
    const tagOrder = new Map(tags.map((t, i) => [t.name, i]))
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      const orderA = tagOrder.get(a) ?? 999
      const orderB = tagOrder.get(b) ?? 999
      if (orderA !== orderB) return orderA - orderB
      return a.localeCompare(b)
    })

    for (const [tagName, tagEndpoints] of sortedGroups) {
      const children: OpenAPINavigationItem[] = tagEndpoints.map(endpoint => ({
        type: 'page' as const,
        title: endpoint.title || `${endpoint.method} ${endpoint.path}`,
        page: this.generateEndpointPath(tagName, endpoint),
        method: endpoint.method as OpenAPINavigationItem['method']
      }))

      navigation.push({
        type: 'group',
        title: this.formatTagName(tagName),
        children
      })
    }

    return navigation
  }

  /**
   * Generate a unique path for an endpoint
   */
  private generateEndpointPath(tag: string, endpoint: ApiReferenceProps): string {
    const slug = endpoint.operationId
      ? this.slugify(endpoint.operationId)
      : this.slugify(`${endpoint.method}_${endpoint.path}`)

    return `/api_reference/${this.slugify(tag)}/${slug}`
  }

  /**
   * Format tag name for display
   */
  private formatTagName(tag: string): string {
    return tag
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  /**
   * Convert string to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[{}]/g, '')
      .replace(/\//g, '_')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  /**
   * Get a specific endpoint by path
   */
  getEndpointByPath(parsedSpec: ParsedOpenAPI, path: string): ApiReferenceProps | undefined {
    // Normalize path
    const normalizedPath = path.replace(/^\//, '').replace(/\.mdx$/, '')

    for (const endpoint of parsedSpec.endpoints) {
      const endpointPath = this.generateEndpointPath(
        endpoint.tags?.[0] || 'default',
        endpoint
      ).replace(/^\//, '')

      if (endpointPath === normalizedPath) {
        return endpoint
      }
    }

    return undefined
  }

  /**
   * Clear cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
}

export const openApiParser = new OpenAPIParserService()
export default openApiParser
