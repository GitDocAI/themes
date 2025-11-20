/**
 * Fetch Utilities with Authentication
 * Provides helpers for making authenticated requests in multi-tenant mode
 */

import { tenantContext } from '../services/tenantContext'

/**
 * Get authentication headers for tenant requests
 */
export function getAuthHeaders(additionalHeaders: HeadersInit = {}): HeadersInit {
  // If not in multi-tenant mode, return only additional headers
  if (!tenantContext.isMultiTenantMode() || !tenantContext.isInitialized()) {
    return additionalHeaders
  }

  const config = tenantContext.getConfig()

  return {
    'Authorization': `Bearer ${config.token}`,
    'X-Tenant-ID': config.tenantId,
    ...additionalHeaders
  }
}

/**
 * Get backend URL for tenant requests
 * Returns tenant-specific backend URL or default
 */
export function getBackendUrl(): string {
  if (tenantContext.isMultiTenantMode() && tenantContext.isInitialized()) {
    return tenantContext.getBackendUrl()
  }

  // Fallback to environment variable
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
}

/**
 * Fetch with automatic tenant authentication
 * Wrapper around fetch that adds authentication headers automatically
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = getAuthHeaders(options.headers)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle token expiration
  if (response.status === 401) {
    console.error('[fetchWithAuth] Unauthorized - token may be expired')

    // Notify parent window about token expiration
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'TOKEN_EXPIRED',
          tenantId: tenantContext.isInitialized() ? tenantContext.getTenantId() : null
        },
        '*' // In production, specify exact origin
      )
    }

    throw new Error('Authentication token expired. Please refresh.')
  }

  return response
}

/**
 * Check if currently in multi-tenant mode
 */
export function isMultiTenantMode(): boolean {
  return tenantContext.isMultiTenantMode()
}

/**
 * Get tenant-specific URL for resource
 * Useful for constructing URLs that need tenant context
 */
export function getTenantResourceUrl(path: string): string {
  const backendUrl = getBackendUrl()

  // Remove leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  return `${backendUrl}/${cleanPath}`
}
