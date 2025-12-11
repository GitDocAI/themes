export interface NavigationPage {
  type: 'page'
  title: string
  page: string
}

export interface NavigationOpenAPI {
  type: 'openapi' | 'swagger'
  title: string
  page: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  reference?: string
  path?: string
}

export interface NavigationDropdown {
  type: 'dropdown'
  title: string
  children: NavigationItem[]
}

export interface NavigationGroup {
  type: 'group'
  title: string
  children: NavigationItem[]
}

export type NavigationItem = NavigationPage | NavigationOpenAPI | NavigationDropdown | NavigationGroup
