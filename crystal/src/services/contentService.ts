/**
 * Content Service
 * Handles saving content to filesystem or API
 */

import { pageLoader } from './pageLoader'
import { apiReferenceLoader } from './apiReferenceLoader'
import { configLoader } from './configLoader'

export class ContentService {
  /**
   * Save content to backend API
   */
  static async saveContent(docId: string, content: string): Promise<void> {
    // Import fetchWithAuth utilities
    const { getBackendUrl, fetchWithAuth } = await import('../utils/fetchWithAuth')

    // Remove leading slash from docId if present to avoid double slashes
    const cleanDocId = docId.startsWith('/') ? docId.slice(1) : docId
    const url = `${getBackendUrl()}/docs/${cleanDocId}`

    // Detect content type based on file extension or content format
    const isMdxFile = cleanDocId.endsWith('.mdx')
    const isJsonContent = content.trim().startsWith('{') || content.trim().startsWith('[')

    let headers: Record<string, string>
    let body: string

    if (isMdxFile || !isJsonContent) {
      // Send as plain text (MDX content)
      headers = {
        'Content-Type': 'text/plain; charset=utf-8',
      }
      body = content
    } else {
      // Send as JSON (legacy format or config)
      headers = {
        'Content-Type': 'application/json',
      }
      body = JSON.stringify({ content })
    }

    const response = await fetchWithAuth(url, {
      method: 'PUT',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ContentService] Error response:', errorText)
      throw new Error(`Failed to save content: ${response.statusText} - ${errorText}`)
    }

    // Invalidate cache after successful save
    pageLoader.invalidateCache(docId)
    apiReferenceLoader.invalidateCache(docId)

    console.log(`[ContentService] Content saved and cache invalidated for: ${docId}`)
  }

  /**
   * Save configuration to backend API
   */
  static async saveConfig(config: any): Promise<void> {
    // Import fetchWithAuth utilities
    const { getBackendUrl, fetchWithAuth } = await import('../utils/fetchWithAuth')

    const configString = JSON.stringify(config, null, 2)

    const response = await fetchWithAuth(`${getBackendUrl()}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: configString,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to save configuration: ${response.statusText} - ${errorText}`)
    }

    // Reload config after successful save to invalidate cache
    await configLoader.reloadConfig()

    console.log('[ContentService] Configuration saved and cache reloaded')
  }
}
