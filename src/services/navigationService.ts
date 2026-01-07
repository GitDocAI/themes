import { configLoader } from './configLoader'
import type { NavigationItem,NavigationDropdown,NavigationGroup,NavigationPage } from '../types/navigation'

export interface NavigationState {
  version?: string
  tab?: string
  page?: string
}

const STORAGE_KEY = 'gitdocai_navigation_state'

class NavigationService {
  /**
   * Find the default page by traversing the navigation structure
   */
  findDefaultPage(version?: string, tab?: string): string | null {
    const config = configLoader.getConfig()
    if (!config?.navigation) return null

    // If versions exist, use the specified version or first version
    const versions = configLoader.getVersions()
    let targetVersion = version
    let targetTab = tab

    if (versions.length > 0) {
      // Use specified version or first version
      targetVersion = version || versions[0].version

      // Get tabs for this version
      const tabs = configLoader.getTabs(targetVersion)
      if (tabs.length === 0) return null

      // Use specified tab or first tab
      targetTab = tab || tabs[0].tab

      // Find the tab object
      const tabObj = tabs.find(t => t.tab === targetTab)
      if (!tabObj || !tabObj.items || tabObj.items.length === 0) return null

      // Find first page in items
      return this.findFirstPageInItems(tabObj.items)
    } else {
      // No versions, check for tabs directly under navigation
      const tabs = configLoader.getTabs()
      if (tabs.length === 0) {
        // No tabs, check for items directly under navigation
        const items = (config.navigation as any).items as NavigationItem[] | undefined
        if (items && items.length > 0) {
          return this.findFirstPageInItems(items)
        }
        return null
      }

      // Use specified tab or first tab
      targetTab = tab || tabs[0].tab

      // Find the tab object
      const tabObj = tabs.find(t => t.tab === targetTab)
      if (!tabObj || !tabObj.items || tabObj.items.length === 0) return null

      // Find first page in items
      return this.findFirstPageInItems(tabObj.items)
    }
  }

  /**
   * Recursively find the first page in a list of navigation items
   */
  private findFirstPageInItems(items: NavigationItem[]): string | null {
    for (const item of items) {
      if (item.type === 'page' && item.page) {
        return item.page
      }

      if (item.type === 'openapi' && (item as any).page) {
        return (item as any).page
      }

      if ((item.type === 'group' || item.type === 'dropdown') && item.children) {
        const page = this.findFirstPageInItems(item.children)
        if (page) return page
      }
    }
    return null
  }

  /**
   * Get navigation state from localStorage
   */
  getStoredState(): NavigationState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading navigation state from localStorage:', error)
      return null
    }
  }

  /**
   * Save navigation state to localStorage
   */

  /**
   * Get navigation state from URL pathname
   */
  getStateFromURL(): NavigationState | null {
    const pathname = window.location.pathname

    // Skip if it's just the root path
    if (pathname === '/' || pathname === '') {
      return null
    }

    // The pathname is the page path - add .mdx extension back
    let page = pathname
    if (!page.endsWith('.mdx')) {
      page = `${page}.mdx`
    }

    // Get version and tab from localStorage since they're not in URL
    const stored = this.getStoredState()

    return {
      version: stored?.version,
      tab: stored?.tab,
      page: page
    }
  }

  /**
   * Update URL with navigation state
   */
  updateURL(state: NavigationState): void {
    if (!state.page) return
    // Use the page path directly in the URL (without .mdx)
    let cleanPath = state.page.replace(/\.mdx$/, '')
    // Remove any double slashes (except after protocol) to avoid URL being interpreted as absolute
    cleanPath = cleanPath.replace(/\/+/g, '/')
    // Ensure path starts with / to avoid being interpreted as absolute URL
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }
    // Store version and tab in localStorage for context, but don't show in URL
    window.history.replaceState({ ...state }, '', cleanPath)
  }

  /**
   * Initialize navigation - determines the initial state based on:
   * 1. Config file (version and tab always from config)
   * 2. URL or localStorage for page selection
   * 3. Default (first available page)
   */
  initialize(): NavigationState {
    // Version and tab ALWAYS come from config file
    const versions = configLoader.getVersions()
    const version = versions.length > 0 ? versions[0].version : undefined
    const tabs = configLoader.getTabs(version)
    const tab = tabs.length > 0 ? tabs[0].tab : undefined

    // Page can come from URL, localStorage, or default
    let page: string | undefined

    // Try URL first for page
    const urlState = this.getStateFromURL()
    if (urlState && urlState.page) {
      page = urlState.page
    }
    // If no page found, use default
    if (!page) {
      page = this.findDefaultPage(version, tab) || ''
    }

    const state: NavigationState = { version, tab, page }
    this.updateURL(state)

    return state
  }

  /**
   * Navigate to a new page and update state
   */
  navigateTo(page: string, version?: string, tab?: string): void {
    const state: NavigationState = {
      version,
      tab,
      page
    }

    this.updateURL(state)
  }

  /**
   * Update version and navigate to first page in that version
   */
  changeVersion(version: string): NavigationState {
    const tabs = configLoader.getTabs(version)
    const tab = tabs.length > 0 ? tabs[0].tab : undefined
    const page = this.findDefaultPage(version, tab) || ''

    const state: NavigationState = { version, tab, page }
    this.updateURL(state)

    return state
  }

  /**
   * Update tab and navigate to first page in that tab
   */
  changeTab(tab: string, version?: string): NavigationState {
    const page = this.findDefaultPage(version, tab) || ''

    const state: NavigationState = { version, tab, page }
    this.updateURL(state)

    return state
  }

  /**
   * Get a human-readable breadcrumb path for the current page
   */
  getBreadcrumb(pagePath: string, version?: string, tab?: string): string[] {
    const breadcrumb: string[] = []

    if (version) breadcrumb.push(version)
    if (tab) breadcrumb.push(tab)

    // Find the page in the navigation structure
    const tabs = configLoader.getTabs(version)
    for (const tabObj of tabs) {
      if (tab && tabObj.tab !== tab) continue

      const path = this.findPagePath(tabObj.items || [], pagePath)
      if (path.length > 0) {
        breadcrumb.push(...path)
        break
      }
    }

    return breadcrumb
  }

  /**
   * Recursively find the path to a page in navigation items
   */
  private findPagePath(items: NavigationItem[], targetPage: string, currentPath: string[] = []): string[] {
    for (const item of items) {
      if (item.type === 'page' && item.page === targetPage) {
        return [...currentPath, item.title]
      }

      if ((item.type === 'group' || item.type === 'dropdown') && item.children) {
        const path = this.findPagePath(item.children, targetPage, [...currentPath, item.title])
        if (path.length > 0) return path
      }
    }
    return []
  }
}


 const findPagePath = (item:NavigationItem,page:string):string|null=>{
    if(item.type!="page"&& item.type!="openapi"){
     return (item as NavigationDropdown|NavigationGroup).children.map(ch=>findPagePath(ch,page)).filter(res=>!!res).pop()||null
    }
    const item_page = (item as NavigationPage)
    if(item_page.title == page ||  item_page.page.split('/').includes(`${page}.mdx`)){
      return item_page.page
    }
    return null
  }
export const FindPagePathByName=(pageName:string,tab?:string,version?:string)=>{
    let path =null
    if(version){
      const version_config =configLoader.getVersions().find(v=>v.version == version)
      const tab_config = version_config?.tabs?.find(t=>t.tab==tab)
      path = tab_config?.items?.map(item=>findPagePath(item,pageName)).filter(p=>!!p).pop() || "/"
    }
    if(tab){
      if(path==null){
        path = configLoader.getTabs()?.find(t=>t.tab==tab)?.items?.map(item=>findPagePath(item,pageName))
        .filter(p=>!!p).pop() || "/"
      }
    }
  return path
}


export const navigationService = new NavigationService()
