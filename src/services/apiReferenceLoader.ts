/**
 * API Reference Loader Service
 * Loads API reference endpoint data from JSON files
 */

import type { ApiReferenceProps } from '../types/ApiReference'
import { getApiReferenceJsonPath } from '../utils/apiReferenceUtils'

class ApiReferenceLoader {
  private cache: Map<string, ApiReferenceProps> = new Map()
  private isProductionMode: boolean

  constructor() {
    // Check if we're in production mode (VITE_MODE=production or VITE_MODE not set)
    const viteMode = import.meta.env.VITE_MODE
    this.isProductionMode = !viteMode || viteMode === 'production'
  }

  /**
   * Load API reference data from JSON file
   * @param pagePath - The path to the MDX page (e.g., "/v1.0.0/api_reference/applications/create_application.mdx")
   * @returns API reference data or null if not found
   */
  async loadApiReference(pagePath: string): Promise<ApiReferenceProps | null> {
    try {
      // Check memory cache first
      if (this.cache.has(pagePath)) {
        return this.cache.get(pagePath)!
      }

      // Import fetchWithAuth utilities
      const { getBackendUrl, fetchWithAuth, isMultiTenantMode } = await import('../utils/fetchWithAuth')

      // Determine the correct path based on mode
      let jsonPath: string
      if (isMultiTenantMode()) {
        // Multi-tenant mode: load from backend with auth
        const cleanPath = pagePath.startsWith('/') ? pagePath.slice(1) : pagePath
        const jsonFile = cleanPath.replace(/\.mdx$/, '.json')
        jsonPath = `${getBackendUrl()}/docs/${jsonFile}`
      } else {
        // Production or Dev mode: use existing logic
        jsonPath = getApiReferenceJsonPath(pagePath, this.isProductionMode)
      }

      // Add timestamp to URL for cache busting
      const cacheBuster = `?t=${Date.now()}`
      const urlWithCacheBuster = `${jsonPath}${cacheBuster}`

      // Fetch with authentication if in multi-tenant mode
      const response = await fetchWithAuth(urlWithCacheBuster, {
        cache: 'no-cache', // Force fresh fetch every time
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error(`Failed to load API reference: ${jsonPath}`)
        return null
      }

      const data = await response.json()

      // Store in memory cache
      this.cache.set(pagePath, data as ApiReferenceProps)

      return data as ApiReferenceProps
    } catch (error) {
      console.error(`Error loading API reference ${pagePath}:`, error)
      return null
    }
  }

  /**
   * Clear cache for a specific page or all pages
   */
  clearCache(pagePath?: string): void {
    if (pagePath) {
      this.cache.delete(pagePath)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Invalidate cache for a page after saving
   * Clears both .json and .mdx versions
   */
  invalidateCache(pagePath: string): void {
    // Clear both .json and .mdx versions
    const jsonPath = pagePath.replace(/\.mdx$/, '.json')
    const mdxPath = pagePath.replace(/\.json$/, '.mdx')

    this.cache.delete(pagePath)
    this.cache.delete(jsonPath)
    this.cache.delete(mdxPath)
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

export const apiReferenceLoader = new ApiReferenceLoader()
