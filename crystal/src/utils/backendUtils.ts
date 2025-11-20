/**
 * Backend Utilities
 * Provides helpers for backend communication
 */

/**
 * Get the backend API URL from environment variables
 */
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
}

/**
 * Fetch gitdocai.config.json from backend API with cache busting
 */
export async function fetchConfig(): Promise<any> {
  const backendUrl = getBackendUrl()

  // Add timestamp to URL for cache busting
  const cacheBuster = `?t=${Date.now()}`
  const response = await fetch(`${backendUrl}/config${cacheBuster}`, {
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.statusText}`)
  }

  return response.json()
}
