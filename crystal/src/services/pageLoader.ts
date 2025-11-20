/**
 * Page Loader Service
 * Loads page content from MDX files and converts to TipTap JSON
 */

import { mdxParser } from './mdxParser'

export interface Block {
  type: string
  content?: string
  items?: string[]
  code?: string
  title?: string
  snippets?: Array<{ language: string; code: string }>
  variant?: string
  [key: string]: any
}

export interface PageData {
  blocks?: Block[] // Legacy format
  content?: any // TipTap JSON format
}

class PageLoader {
  private cache: Map<string, PageData> = new Map()
  private isProductionMode: boolean

  constructor() {
    // Check if we're in production mode (VITE_MODE=production or VITE_MODE not set)
    const viteMode = import.meta.env.VITE_MODE
    this.isProductionMode = !viteMode || viteMode === 'production'
  }

  /**
   * Load page content from MDX file
   * In production: loads from public folder directly
   * In dev/preview: loads from backend API
   * In multi-tenant mode: loads from tenant-specific backend with auth
   */
  async loadPage(pagePath: string): Promise<PageData | null> {
    try {
      // Check memory cache first
      if (this.cache.has(pagePath)) {
        return this.cache.get(pagePath)!
      }

      // Import fetchWithAuth utilities
      const { getBackendUrl, fetchWithAuth, isMultiTenantMode } = await import('../utils/fetchWithAuth')

      // Determine the correct path based on mode
      let mdxPath: string
      if (isMultiTenantMode()) {
        // Multi-tenant mode: always load from backend with auth
        // Remove leading slash from pagePath if present
        const cleanPath = pagePath.startsWith('/') ? pagePath.slice(1) : pagePath
        mdxPath = `${getBackendUrl()}/docs/${cleanPath}`
      } else if (this.isProductionMode) {
        // Production: load directly from public folder
        mdxPath = pagePath // Keep .mdx extension
      } else {
        // Dev/Preview: load from backend API
        mdxPath = `/api/docs${pagePath}`
      }

      // Add timestamp to URL for cache busting
      const cacheBuster = `?t=${Date.now()}`
      const urlWithCacheBuster = `${mdxPath}${cacheBuster}`

      // Fetch MDX content with authentication if in multi-tenant mode
      const response = await fetchWithAuth(urlWithCacheBuster, {
        cache: 'no-cache', // Force fresh fetch every time
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        console.error(`Failed to load page: ${mdxPath}`)
        return null
      }

      const mdxContent = await response.text()

      // Parse MDX to TipTap JSON
      const tiptapContent = await mdxParser.parse(mdxContent)

      const pageData: PageData = {
        content: tiptapContent
      }

      // Store in memory cache
      this.cache.set(pagePath, pageData)

      return pageData
    } catch (error) {
      console.error(`Error loading page ${pagePath}:`, error)
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

    console.log(`[PageLoader] Cache invalidated for: ${pagePath}`)
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

export const pageLoader = new PageLoader()
