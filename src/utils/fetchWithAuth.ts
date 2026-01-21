/**
 * Fetch Utilities with Authentication
 * Provides helpers for making authenticated requests in multi-tenant mode
 */

const viteMode = import.meta.env.VITE_MODE || 'production';
import type { AxiosResponse } from 'axios'
import { tenantContext } from '../services/tenantContext'
import axiosInstance, { clearTokens, getRefreshToken, setTokens } from './axiosInstance'

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
  options: RequestInit = {},
  retrying?:boolean
): Promise<Response> {
  const headers = getAuthHeaders(options.headers)

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle token expiration
  if (response.status === 401 && !url.includes('/refresh-token') && !retrying) {
    console.error('[fetchWithAuth] Unauthorized - token may be expired')
    if(viteMode=="production"){
      const refreshToken = getRefreshToken()
      return await axiosInstance.post(`${axiosInstance.defaults.baseURL}/refresh`, { refreshToken })
          .then((res: AxiosResponse) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data
            setTokens(accessToken, newRefreshToken)
            return fetchWithAuth(url,options,true)
          })
          .catch((_err: any) => {
            clearTokens()
            window.location.href = '/login' // Redirect to login on refresh failure
            return new Response()
          })
    }else{
         window.location.href = '/403'
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
 * Get dashboard URL dynamically
 * Constructs the dashboard URL based on current environment
 */
export function getDashboardUrl(path: string = ''): string {
  const backendUrl = getBackendUrl()

  try {
    const url = new URL(backendUrl, window.location.origin)
    // Extract base domain and construct dashboard URL
    // e.g., api.dev.gitdoc.ai -> dashboard.dev.gitdoc.ai
    const host = url.host
    const dashboardHost = host.replace(/^api\./, 'dashboard.').replace(/^[^.]+\./, 'dashboard.')
    const protocol = url.protocol || window.location.protocol
    return `${protocol}//${dashboardHost}${path}`
  } catch {
    // Fallback: use current origin
    return `${window.location.origin}${path}`
  }
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
