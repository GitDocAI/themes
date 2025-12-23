/**
 * Content Service
 * Handles saving content to filesystem or API
 */
import axiosInstance from '../utils/axiosInstance'
import { pageLoader } from './pageLoader'
import { apiReferenceLoader } from './apiReferenceLoader'
import { configLoader } from './configLoader'
import { mdxSerializer } from './mdxSerializer'


export class ContentService {
  /**
   * Save content to backend API
   */
  static async saveContent(docId: string, content: string): Promise<void> {
    // Remove leading slash from docId if present to avoid double slashes
    const cleanDocId = docId.startsWith('/') ? docId.slice(1) : docId

    const url = '/content/api/v1/filesystem/entry'
    // Detect content type based on file extension or content format
    const isMdxFile = cleanDocId.endsWith('.mdx')
    const isJsonContent = content.trim().startsWith('{') || content.trim().startsWith('[')

    let headers: Record<string, string>
    let body: any

    if (isMdxFile || !isJsonContent) {
      // Send as plain text (MDX content)
      headers = {
        'Content-Type': 'text/plain; charset=utf-8',
      }
      body = {
          path: cleanDocId,
          type:'file',
          content:mdxSerializer.serialize(JSON.parse(content) as any)
      }

    } else {
      // Send as JSON (legacy format or config)
      headers = {
        'Content-Type': 'application/json',
      }
      body = {
          path: cleanDocId,
          type:'file',
          content:content
         }
    }
    try{
        await axiosInstance.post(url, body, { headers })
    }catch(error){
      throw new Error(`Failed to save content: ${error}`)
    }

    // Invalidate cache after successful save
    pageLoader.invalidateCache(docId)
    apiReferenceLoader.invalidateCache(docId)

    console.log(`[ContentService] Content saved and cache invalidated for: ${docId}`)
  }


  static async createEntryFolder(docId: string): Promise<void> {
    // Remove leading slash from docId if present to avoid double slashes
    const cleanDocId = docId.startsWith('/') ? docId.slice(1) : docId

    const url = '/content/api/v1/filesystem/entry'

    const  body = {
          path: cleanDocId,
          type:'folder',
          content:""
    }

    try{
        await axiosInstance.post(url, body )
    }catch(error){
      throw new Error(`Failed to save content: ${error}`)
    }

    console.log(`[ContentService] Content saved and cache invalidated for: ${docId}`)
  }

  /**
   * Save configuration to backend API
   */
  static async saveConfig(config: any): Promise<void> {
    const url = '/content/api/v1/filesystem/entry'
    try {
        await axiosInstance.post(url, {
          path: '/gitdocai.config.json',
          type:'file',
          content: JSON.stringify(config, null, 2)
      }, {
          headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`)
    }
    // Reload config after successful save to invalidate cache
    await configLoader.reloadConfig()
    console.log('[ContentService] Configuration saved and cache reloaded')
  }

  /**
   * Rename a file on the backend
   */
  static async renameFile(oldPath: string, newPath: string,type="file"): Promise<void> {
    const url = '/content/api/v1/filesystem/move'
    try {
      await axiosInstance.post(url, { from: oldPath, to: newPath,type,action:"move" })
    } catch (error) {
      throw new Error(`Failed to rename file: ${error}`)
    }
  }


  static async removeItem(path: string): Promise<void> {
    const url = '/content/api/v1/filesystem/delete'
    try {
      await axiosInstance.post(url, { path })
    } catch (error) {
      throw new Error(`Failed to rename file: ${error}`)
    }
  }

  /**
   * Upload a file to the backend
   */
  static async uploadFile(file:File): Promise<any> {
    const url = '/content/api/v1/filesystem/upload'

    const formData = new FormData();

    formData.append('file', file, file.name);
    try {
      const response = await axiosInstance.post(url, formData)
      return response.data
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`)
    }
  }

  private static getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'svg': 'image/svg+xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'pdf': 'application/pdf',
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  static async downloadFile(path:string): Promise<any> {
    const url = '/content/api/v1/filesystem/download'

    try {
      const response = await axiosInstance.post(url, {path},{responseType:'blob'})
      const originalBlob = response.data;
      // Re-create blob with correct MIME type based on file extension
      const mimeType = this.getMimeType(path)
      const imageBlob = new Blob([originalBlob], { type: mimeType })
      const objectUrl = URL.createObjectURL(imageBlob);
      return objectUrl
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`)
    }
  }

}

export const contentService = new ContentService()
