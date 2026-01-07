/**
 * Tenant Context Service
 * Manages tenant-specific configuration for multi-tenant mode
 */

export interface TenantConfig {
  tenantId: string
  token: string
  backendUrl: string
  documentId?: string
}

class TenantContext {
  private config: TenantConfig | null = null
  private listeners: Set<(config: TenantConfig) => void> = new Set()

  /**
   * Initialize tenant context with configuration from parent window
   */
  initialize(config: TenantConfig): void {
    this.config = config
    console.log('[TenantContext] Initialized for tenant:', config.tenantId)

    // Notify all listeners
    this.notifyListeners()
  }

  /**
   * Get current tenant configuration
   */
  getConfig(): TenantConfig {
    if (!this.config) {
      throw new Error('Tenant context not initialized. Make sure authentication is completed.')
    }
    return this.config
  }

  /**
   * Get tenant ID
   */
  getTenantId(): string {
    return this.getConfig().tenantId
  }

  /**
   * Get authentication token
   */
  getToken(): string {
    return this.getConfig().token
  }

  /**
   * Get backend URL
   */
  getBackendUrl(): string {
    return this.getConfig().backendUrl
  }

  /**
   * Update authentication token (for token refresh)
   */
  updateToken(newToken: string): void {
    if (!this.config) {
      throw new Error('Cannot update token: tenant context not initialized')
    }

    this.config = {
      ...this.config,
      token: newToken
    }

    this.notifyListeners()
  }

  /**
   * Check if tenant context is initialized
   */
  isInitialized(): boolean {
    return this.config !== null
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: TenantConfig) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of configuration change
   */
  private notifyListeners(): void {
    if (this.config) {
      this.listeners.forEach(listener => listener(this.config!))
    }
  }

  /**
   * Check if running in multi-tenant mode
   * Multi-tenant mode is detected by URL parameters
   */
  isMultiTenantMode(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.has('tenant')
  }

  /**
   * Get tenant ID from URL (before initialization)
   */
  getTenantIdFromURL(): string | null {
    const params = new URLSearchParams(window.location.search)
    return params.get('tenant')
  }

  /**
   * Get document ID from URL
   */
  getDocumentIdFromURL(): string | null {
    const params = new URLSearchParams(window.location.search)
    return params.get('doc')
  }

  /**
   * Clear tenant context (for testing or logout)
   */
  clear(): void {
    this.config = null
  }
}

// Export singleton instance
export const tenantContext = new TenantContext()
