/**
 * GitDocAI Config Loader Service
 *
 * Loads and provides access to gitdocai.config.json configuration
 */

import axiosInstance from '../utils/axiosInstance'

import type { NavigationItem } from '../types/navigation'

export interface Tab {
  tab: string
  items?: NavigationItem[]
}

export interface Version {
  version: string
  paths?: string[]
  tabs?: Tab[]
}

export interface Navigation {
  versions?: Version[]
  tabs?: Tab[]
}

export interface GitDocAIConfig {
  name?: string
  description?: string
  theme?: string
  colors?: {
    light?: string
    dark?: string
  }
  defaultThemeMode?: 'light' | 'dark'
  logo?: {
    light?: string
    dark?: string
  }
  favicon?: string
  background?: {
    colors?: {
      dark?: string
      light?: string
    }
  }
  banner?: {
    message: string
    colors: {
      light: string
      dark: string
    }
  }
  navbar?: Array<{
    type: 'link' | 'button'
    label: string
    reference: string
  }>
  footer?: Array<{
    type: string
    reference: string
  }>
  navigation?: Navigation
}

class ConfigLoader {
  private config: GitDocAIConfig | null = null
  private loading: Promise<GitDocAIConfig> | null = null
  private listeners: Set<() => void> = new Set()

  constructor() {
  }

  /**
   * Adjust color brightness
   * @param hex - Hex color (e.g., '#0D0F11')
   * @param percent - Percentage to adjust (-100 to 100). Positive = lighter, Negative = darker
   */
  private adjustBrightness(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace('#', '')

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Adjust each component
    const adjust = (color: number) => {
      const adjusted = Math.round(color + (color * percent / 100))
      return Math.max(0, Math.min(255, adjusted))
    }

    const newR = adjust(r)
    const newG = adjust(g)
    const newB = adjust(b)

    // Convert back to hex
    const toHex = (n: number) => {
      const hex = n.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
  }

  /**
  *Load theme name to know wich component to load
  ***/

  async getThemeName(): Promise<string> {
    const configUrl: string = '/theme';
    try{
      const response = await axiosInstance.get(configUrl,{ responseType: 'text' })
      return response.data
    }catch(error){
      throw new Error(`Failed to load configuration: ${error}`)
    }
  }



  /**
   * Load configuration from gitdocai.config.json
   */
  async loadConfig(): Promise<GitDocAIConfig> {
    // Return cached config if already loaded
    if (this.config) {
      return this.config
    }

    // Return existing promise if already loading
    if (this.loading) {
      return this.loading
    }

    // Start loading
    this.loading = this.fetchConfig()
    this.config = await this.loading
    this.loading = null

    return this.config
  }

 private async fetchConfig(): Promise<GitDocAIConfig> {
    // Use the correct API endpoint for loading configuration
    const configUrl: string = '/content/api/v1/filesystem/file';
    try{
      const response = await axiosInstance.post(configUrl, { path: '/gitdocai.config.json' }, { responseType: 'json' })
      const config = JSON.parse(response.data.content)
      return config
    }catch(error){
      throw new Error(`Failed to load configuration: ${error}`)
    }
  }
  /**
   * Get current config (synchronous, returns null if not loaded)
   */
  getConfig(): GitDocAIConfig | null {
    return this.config
  }

  /**
   * Update config in memory (without reloading)
   */
  updateConfig(newConfig: GitDocAIConfig): void {
    this.config = newConfig
    this.notifyListeners()
  }

  /**
   * Reload config from server
   */
  async reloadConfig(): Promise<GitDocAIConfig> {
    this.config = null
    this.loading = null
    const config = await this.loadConfig()
    this.notifyListeners()
    return config
  }

  /**
   * Subscribe to config changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of config change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  /**
   * Get theme mode (light or dark)
   */
  getDefaultThemeMode(): 'light' | 'dark' {
    return this.config?.defaultThemeMode || 'light'
  }

  /**
   * Get primary color for theme
   */
  getPrimaryColor(theme: 'light' | 'dark'): string {
    return this.config?.colors?.[theme] || (theme === 'light' ? '#3A8DDE' : '#655DC6')
  }

  /**
   * Get background color for theme
   */
  getBackgroundColor(theme: 'light' | 'dark'): string {
    return this.config?.background?.colors?.[theme] || (theme === 'light' ? '#ffffff' : '#0D0F11')
  }

  /**
   * Calculate luminance of a color (0-1 scale)
   */
  private getLuminance(hex: string): number {
    hex = hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    // Apply gamma correction
    const sRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

    return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b)
  }

  /**
   * Get navbar background color (adjusted based on background luminance)
   * Creates a subtle but visible contrast with the background
   */
  getNavbarBackgroundColor(theme: 'light' | 'dark'): string {
    const bgColor = this.getBackgroundColor(theme)
    const luminance = this.getLuminance(bgColor)

    if (theme === 'dark') {
      // For dark backgrounds, we want a slightly lighter navbar
      // If the background is very dark (luminance < 0.1), add more brightness
      // If it's a colorful dark bg (like purple #8b5cf6), we need a different approach
      if (luminance < 0.05) {
        // Very dark background -> add significant brightness
        return this.adjustBrightness(bgColor, 40)
      } else if (luminance < 0.2) {
        // Dark but with some color -> shift to a neutral dark tone
        // Mix with a dark blue-grey (#0E1320)
        return this.blendToNeutralDark(bgColor)
      } else {
        // Medium dark -> just lighten a bit
        return this.adjustBrightness(bgColor, 20)
      }
    } else {
      // Light mode: slightly darker
      return this.adjustBrightness(bgColor, -5)
    }
  }

  /**
   * Blend a colorful dark background toward a neutral dark tone
   */
  private blendToNeutralDark(hex: string): string {
    // Target neutral dark color (like #0E1320)
    const targetR = 14
    const targetG = 19
    const targetB = 32

    // Parse source color
    hex = hex.replace('#', '')
    const srcR = parseInt(hex.substring(0, 2), 16)
    const srcG = parseInt(hex.substring(2, 4), 16)
    const srcB = parseInt(hex.substring(4, 6), 16)

    // Blend 80% toward neutral, 20% keep original
    const blend = 0.8
    const newR = Math.round(srcR * (1 - blend) + targetR * blend)
    const newG = Math.round(srcG * (1 - blend) + targetG * blend)
    const newB = Math.round(srcB * (1 - blend) + targetB * blend)

    const toHex = (n: number) => {
      const hex = n.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }

    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
  }

  /**
   * Get logo path for theme
   */
  getLogo(theme: 'light' | 'dark'): string {
    return this.config?.logo?.[theme] || ''
  }

  /**
   * Get favicon path
   */
  getFavicon(): string {
    return this.config?.favicon || '/favicon.ico'
  }

  /**
   * Get site name
   */
  getName(): string {
    return this.config?.name || 'Documentation'
  }

  /**
   * Get site description
   */
  getDescription(): string {
    return this.config?.description || ''
  }

  /**
   * Get navbar items
   */
  getNavbarItems(): Array<{ type: string; label: string; reference: string }> {
    return this.config?.navbar || []
  }

  /**
   * Get footer items
   */
  getFooterItems(): Array<{ type: string; reference: string }> {
    return this.config?.footer || []
  }

  /**
   * Get text color for theme
   */
  getTextColor(theme: 'light' | 'dark'): string {
    return theme === 'light' ? '#111827' : '#f9fafb'
  }

  /**
   * Get secondary text color for theme
   */
  getSecondaryTextColor(theme: 'light' | 'dark'): string {
    return theme === 'light' ? '#374151' : '#d1d5db'
  }

  /**
   * Get border color for theme
   */
  getBorderColor(theme: 'light' | 'dark'): string {
    return theme === 'light' ? '#d1d5db' : '#4b5563'
  }

  /**
   * Get hover background color for theme
   */
  getHoverBackgroundColor(theme: 'light' | 'dark'): string {
    return theme === 'light' ? '#f3f4f6' : '#374151'
  }

  /**
   * Get button background color (uses primary color)
   */
  getButtonBackgroundColor(theme: 'light' | 'dark'): string {
    return this.getPrimaryColor(theme)
  }

  /**
   * Get button hover color (darker version of primary)
   */
  getButtonHoverColor(theme: 'light' | 'dark'): string {
    return theme === 'light' ? '#2563eb' : '#4f46e5'
  }

  /**
   * Get navigation configuration
   */
  getNavigation(): Navigation | undefined {
    return this.config?.navigation
  }

  /**
   * Get versions from navigation
   */
  getVersions(): Version[] {
    return this.config?.navigation?.versions || []
  }

  /**
   * Check if versions are configured
   */
  hasVersions(): boolean {
    return (this.config?.navigation?.versions?.length || 0) > 0
  }

  /**
   * Get tabs for a specific version, or global tabs if no version specified
   * @param version - Version string (e.g., "v1.0.0") or undefined for global tabs
   */
  getTabs(version?: string): Tab[] {
    // If version is specified and versions exist, get tabs from that version
    if (version && this.config?.navigation?.versions) {
      const versionObj = this.config.navigation.versions.find(v => v.version === version)
      if (versionObj?.tabs) {
        return versionObj.tabs
      }
    }

    // Otherwise, return global tabs if they exist
    return this.config?.navigation?.tabs || []
  }

  /**
   * Check if tabs are configured (either global or in any version)
   */
  hasTabs(version?: string): boolean {
    if (version) {
      return this.getTabs(version).length > 0
    }
    // Check if any tabs exist (global or in versions)
    const hasGlobalTabs = (this.config?.navigation?.tabs?.length || 0) > 0
    const hasVersionTabs = this.config?.navigation?.versions?.some(v => (v.tabs?.length || 0) > 0) || false
    return hasGlobalTabs || hasVersionTabs
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader()
