/**
 * Content Service
 * Handles saving content to filesystem or API
 */
import axiosInstance from '../utils/axiosInstance'
import { pageLoader } from './pageLoader'
import { apiReferenceLoader } from './apiReferenceLoader'
import { configLoader } from './configLoader'
import type { AxiosResponse } from 'axios'

export class ContentService {
  /**
   * Save content to backend API
   */
  static async saveContent(docId: string, content: string): Promise<void> {
    // Import fetchWithAuth utilities
     // Remove leading slash from docId if present to avoid double slashes
    const cleanDocId = docId.startsWith('/') ? docId.slice(1) : docId
    const url = `/docs/content/${cleanDocId}?t=${Date.now()}`
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
    try{
        await  axiosInstance.put(url,body)
    }catch(error){
      throw new Error(`Failed to save content: ${error}`)
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

    const configString = JSON.stringify(config, null, 2)
    const url ='/docs/content/gitdocai.config.json'

    let response:AxiosResponse;
    try{
        response = await  axiosInstance.put(url,configString)
    }catch(error){
      throw new Error(`Failed to save configuration: ${error}`)
    }
    // Reload config after successful save to invalidate cache
    await configLoader.reloadConfig()
    console.log('[ContentService] Configuration saved and cache reloaded')
  }
}

export const contentService = new ContentService()
