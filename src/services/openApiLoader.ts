/**
 * OpenAPI Loader Service
 * Loads and manages OpenAPI specs, providing navigation and endpoint data
 */

import { openApiParser, type ParsedOpenAPI, type OpenAPINavigationItem } from './openApiParser'
import type { ApiReferenceProps } from '../types/ApiReference'
import type { NavigationItem, NavigationGroup, NavigationOpenAPI } from '../types/navigation'
import axiosInstance from '../utils/axiosInstance'

class OpenAPILoaderService {
  private parsedSpecs: Map<string, ParsedOpenAPI> = new Map()
  private loading: Map<string, Promise<ParsedOpenAPI | null>> = new Map()

  /**
   * Load and parse an OpenAPI spec
   * @param specPath - Path to the OpenAPI JSON file (e.g., "/api_reference/openapi.json")
   * @returns Parsed OpenAPI data or null if failed
   */
  async loadSpec(specPath: string): Promise<ParsedOpenAPI | null> {
    // Return cached if available
    if (this.parsedSpecs.has(specPath)) {
      return this.parsedSpecs.get(specPath)!
    }

    // Return existing promise if already loading
    if (this.loading.has(specPath)) {
      return this.loading.get(specPath)!
    }

    // Start loading
    const loadPromise = this.fetchAndParse(specPath)
    this.loading.set(specPath, loadPromise)

    try {
      const result = await loadPromise
      if (result) {
        this.parsedSpecs.set(specPath, result)
      }
      return result
    } finally {
      this.loading.delete(specPath)
    }
  }

  /**
   * Fetch and parse the OpenAPI spec
   * Uses the same API endpoint as favicon/content loading
   */
  private async fetchAndParse(specPath: string): Promise<ParsedOpenAPI | null> {
    try {
      const url = '/content/api/v1/filesystem/file'

      console.log('[OpenAPILoader] Loading spec from path:', specPath)

      const response = await axiosInstance.post(url, { path: specPath }, { responseType: 'json' })

      if (!response.data || !response.data.content) {
        console.error('[OpenAPILoader] No content in response')
        return null
      }

      // Parse the JSON content
      const specObject = typeof response.data.content === 'string'
        ? JSON.parse(response.data.content)
        : response.data.content

      console.log('[OpenAPILoader] Spec loaded, parsing...')

      // Parse using the OpenAPI parser
      const parsed = await openApiParser.parse(specObject)
      console.log(`[OpenAPILoader] Parsed ${parsed.endpoints.length} endpoints`)

      return parsed
    } catch (error) {
      console.error('[OpenAPILoader] Error loading spec:', error)
      return null
    }
  }

  /**
   * Get navigation items from a parsed OpenAPI spec
   * Converts OpenAPI navigation to the NavigationItem[] format used by Sidebar
   */
  getNavigationItems(specPath: string): NavigationItem[] {
    const parsed = this.parsedSpecs.get(specPath)
    if (!parsed) {
      return []
    }

    return this.convertNavigation(parsed.navigation, specPath)
  }

  /**
   * Convert OpenAPI navigation to NavigationItem format
   */
  private convertNavigation(items: OpenAPINavigationItem[], specPath: string): NavigationItem[] {
    return items.map(item => {
      if (item.type === 'group' && item.children) {
        const group: NavigationGroup = {
          type: 'group',
          title: item.title,
          children: item.children.map(child => this.convertNavigationItem(child, specPath))
        }
        return group
      }
      return this.convertNavigationItem(item, specPath)
    })
  }

  /**
   * Convert a single navigation item
   */
  private convertNavigationItem(item: OpenAPINavigationItem, specPath: string): NavigationItem {
    if (item.type === 'page' && item.page) {
      const openApiItem: NavigationOpenAPI = {
        type: 'openapi',
        title: item.title,
        page: item.page,
        method: item.method,
        specPath: specPath
      }
      return openApiItem
    }

    if (item.type === 'group' && item.children) {
      const group: NavigationGroup = {
        type: 'group',
        title: item.title,
        children: item.children.map(child => this.convertNavigationItem(child, specPath))
      }
      return group
    }

    // Fallback
    return {
      type: 'openapi',
      title: item.title,
      page: item.page || '',
      method: item.method,
      specPath: specPath
    } as NavigationOpenAPI
  }

  /**
   * Get endpoint data by path
   * @param specPath - Path to the OpenAPI spec
   * @param endpointPath - Path to the specific endpoint (e.g., "/api_reference/users/get_users")
   */
  getEndpoint(specPath: string, endpointPath: string): ApiReferenceProps | undefined {
    const parsed = this.parsedSpecs.get(specPath)
    if (!parsed) {
      return undefined
    }

    return openApiParser.getEndpointByPath(parsed, endpointPath)
  }

  /**
   * Get endpoint data by operation ID
   */
  getEndpointByOperationId(specPath: string, operationId: string): ApiReferenceProps | undefined {
    const parsed = this.parsedSpecs.get(specPath)
    if (!parsed) {
      return undefined
    }

    return parsed.endpoints.find(e => e.operationId === operationId)
  }

  /**
   * Get all endpoints from a spec
   */
  getAllEndpoints(specPath: string): ApiReferenceProps[] {
    const parsed = this.parsedSpecs.get(specPath)
    if (!parsed) {
      return []
    }
    return parsed.endpoints
  }

  /**
   * Get parsed spec info
   */
  getSpecInfo(specPath: string): ParsedOpenAPI['info'] | undefined {
    const parsed = this.parsedSpecs.get(specPath)
    return parsed?.info
  }

  /**
   * Check if a spec is loaded
   */
  isSpecLoaded(specPath: string): boolean {
    return this.parsedSpecs.has(specPath)
  }

  /**
   * Clear cache for a specific spec or all specs
   */
  clearCache(specPath?: string): void {
    if (specPath) {
      this.parsedSpecs.delete(specPath)
      openApiParser.clearCache(specPath)
    } else {
      this.parsedSpecs.clear()
      openApiParser.clearCache()
    }
  }
}

export const openApiLoader = new OpenAPILoaderService()
export type { ParsedOpenAPI, OpenAPINavigationItem }
