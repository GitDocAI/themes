import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { Banner } from '../components/Banner'
import { SettingsSidebar } from '../components/SettingsSidebar'
import { TabBar } from '../components/TabBar'
import { Sidebar } from '../components/Sidebar'
import { Footer } from '../components/Footer'
import { PageViewer } from '../components/PageViewer'
import { TOC } from '../components/TOC'
import { RightPanel } from '../components/RightPanel'
import { PrevNextNavigation } from '../components/PrevNextNavigation'
import { SearchModal } from '../components/SearchModal'
import { configLoader, type AISearchConfig, type Version } from '../../services/configLoader'
import { openApiLoader } from '../../services/openApiLoader'
import { FindPagePathByName, navigationService } from '../../services/navigationService'
import { pageLoader } from '../../services/pageLoader'
import type { Tab } from '../../services/configLoader'
import type { NavigationDropdown, NavigationGroup, NavigationItem, NavigationPage } from '../../types/navigation'
import { useTheme } from '../hooks/useTheme'
import { useRightPanelContent } from '../hooks/useRightPanelContent'
import { useConfig } from '../hooks/useConfig'
import { useTextHighlight } from '../hooks/useTextHighlight'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'
import './Theme.css'
import OptionsSidebar from '../components/OptionsSidebar'
import { ChatSidebar } from '../components/ChatSidebar'
import { AISearchSidebar } from '../components/AISearchSidebar'
import TextSelectionContextMenu from '../components/ContextMenu'
import {type ChatContext} from '../../services/agentService'
function Documentation() {
  const { theme, toggleTheme, isConfigLoaded } = useTheme()
  const { updateTrigger } = useConfig() // Subscribe to config changes
  useTextHighlight() // Enable search term highlighting from URL
  const viteMode = import.meta.env.VITE_MODE || 'production'
  const isProductionMode = viteMode === 'production'
  const isDevEnvironment = viteMode === 'dev' // true only in dev mode (allows uploads)
  const [isDevMode, setIsDevMode] = useState<boolean>(!isProductionMode) // Enabled by default in dev/preview, disabled in production
  const [isSettingsSidebarOpen, setIsSettingsSidebarOpen] = useState<boolean>(false)
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState<boolean>(false)
  const [error, _setError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [currentTab, setCurrentTab] = useState<string>('')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6')
  const [sidebarItems, setSidebarItems] = useState<NavigationItem[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false)
  const [aiContexts,setAiContexts] =useState<ChatContext[]>([])
  const [isContentAccessible, setIsContentAccessible] = useState<boolean>(false)
  const [aiSearchConfig, setAISearchConfig] = useState<AISearchConfig | undefined>(undefined)
  const [isAISearchSidebarOpen, setIsAISearchSidebarOpen] = useState<boolean>(false)
  const [currentOpenApiSpec, setCurrentOpenApiSpec] = useState<string | undefined>(undefined)
  const [pageRefreshKey, setPageRefreshKey] = useState<number>(0)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 1024)

  // Detect mobile/tablet screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Use custom hook to detect RightPanel content
  const rightPanelContent = useRightPanelContent(currentPath)

  // Debug log
  useEffect(() => {
  }, [rightPanelContent])

  // Keyboard shortcut for search (Cmd+K or Ctrl+K) - Only in production mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Only open search modal in production mode
        if (isProductionMode) {
          setShowSearchModal(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isProductionMode])

  // Initialize navigation from URL, localStorage, or defaults
  useEffect(() => {
    if (isConfigLoaded) {
      const config = configLoader.getConfig()
      if (config) {
        setPrimaryColor(configLoader.getPrimaryColor(theme))
        setAISearchConfig(configLoader.getAISearchConfig())
        setVersions(configLoader.getVersions())

        // Initialize navigation state
        const navState = navigationService.initialize()

        // Set version
        if (navState.version) {
          setCurrentVersion(navState.version)
        }

        // Load tabs
        const loadedTabs = configLoader.getTabs(navState.version)
        setTabs(loadedTabs)

        // Set tab and check for OpenAPI spec
        if (navState.tab) {
          setCurrentTab(navState.tab)

          // Check if this tab has an OpenAPI reference
          const tabObj = loadedTabs.find(t => t.tab === navState.tab)
          if (tabObj?.api_reference) {
            setCurrentOpenApiSpec(tabObj.api_reference)
          }
        }

        // Set page
        if (navState.page) {
          setCurrentPath(navState.page)
        }

      }
    }
  }, [isConfigLoaded, theme])

  // Verify content access before rendering the layout
  // This prevents the layout from flashing before a 401 redirect
  useEffect(() => {
    if (isConfigLoaded && currentPath && !isContentAccessible) {
      // Skip verification for OpenAPI paths - they are loaded differently
      if (currentPath.includes('api_reference')) {
        setIsContentAccessible(true)
        return
      }

      // Try to load the page content to verify access
      pageLoader.loadPage(currentPath)
        .then(() => {
          // Content is accessible, allow layout to render
          setIsContentAccessible(true)
        })
        .catch((err) => {
          // If 401, axios interceptor will redirect to login
          // For other errors, still allow layout to render (error will show in PageViewer)
          if (err?.response?.status !== 401) {
            setIsContentAccessible(true)
          }
          // If 401, keep isContentAccessible as false and let interceptor handle redirect
        })
    }
  }, [isConfigLoaded, currentPath, isContentAccessible])

  // Update sidebar items when version or tab changes
  useEffect(() => {
    const loadSidebarItems = async () => {
      if (tabs.length > 0 && currentTab) {
        const currentTabObj = tabs.find(t => t.tab === currentTab)

        // Check if this tab has an OpenAPI reference
        if (currentTabObj?.api_reference) {
          console.log('[Documentation] Loading OpenAPI spec:', currentTabObj.api_reference)
          setCurrentOpenApiSpec(currentTabObj.api_reference)

          // Load the OpenAPI spec
          const parsed = await openApiLoader.loadSpec(currentTabObj.api_reference)
          if (parsed) {
            // Get navigation items from the parsed spec
            const navItems = openApiLoader.getNavigationItems(currentTabObj.api_reference)
            setSidebarItems(navItems)

            // If no current path, set to first endpoint
            if (!currentPath && parsed.endpoints.length > 0) {
              const firstEndpoint = parsed.navigation[0]
              if (firstEndpoint?.type === 'group' && firstEndpoint.children?.[0]) {
                setCurrentPath(firstEndpoint.children[0].page || '')
              } else if (firstEndpoint?.page) {
                setCurrentPath(firstEndpoint.page)
              }
            }
          } else {
            setSidebarItems([])
          }
        } else if (currentTabObj?.items) {
          // Regular tab with static items
          setCurrentOpenApiSpec(undefined)
          setSidebarItems(currentTabObj.items)
        } else {
          setCurrentOpenApiSpec(undefined)
          setSidebarItems([])
        }
      }
    }

    loadSidebarItems()
  }, [currentTab, tabs])

  // Update document title when page changes
  useEffect(() => {
    if (currentPath) {
      const breadcrumb = navigationService.getBreadcrumb(currentPath, currentVersion, currentTab)
      if (breadcrumb.length > 0) {
        // Only use the last item (page title) from breadcrumb
        const pageTitle = breadcrumb[breadcrumb.length - 1]
        document.title = `${pageTitle} - ${configLoader.getConfig()?.name || 'Documentation'}`
      }
    }
  }, [currentPath, currentVersion, currentTab])

  // React to config changes without page reload
  useEffect(() => {
    if (updateTrigger > 0) {
      const config = configLoader.getConfig()
      if (config) {
        setPrimaryColor(configLoader.getPrimaryColor(theme))
        const loadedTabs = configLoader.getTabs(currentVersion)
        setTabs(loadedTabs)
        // Don't update sidebarItems here - let the other useEffect handle it when tabs changes
      }
    }
  }, [updateTrigger, currentVersion, theme])

  // const handleToolResult = (toolResult: { [key: string]: any }) => {
  //   const toolName = Object.keys(toolResult)[0];
  //   const result = toolResult[toolName];
  //
  //   const newContext: ChatContext = {
  //       id: `tool-${toolName}-${Date.now()}`,
  //       type: 'tool_result',
  //       content: JSON.stringify(result),
  //       fileName: toolName
  //   };
  //
  //   setAiContexts(prev => [...prev, newContext]);
  // }

  // Show loading until config is loaded AND content access is verified
  // This prevents the layout from flashing before a 401 redirect to login
  if (!isConfigLoaded || !isContentAccessible) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3b82f6' }}></i>
      </div>
    )
  }

  if (error) {
    return (
      <>
        <Navbar theme={theme} onThemeChange={toggleTheme} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00'
          }}>
            <h2 style={{ margin: '0 0 10px 0' }}>Error Loading Documentation</h2>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      </>
    )
  }

  const handleVersionChange = (version: string) => {
    // Use navigation service to change version
    const newState = navigationService.changeVersion(version)

    setCurrentVersion(newState.version!)

    // Update tabs when version changes
    const versionTabs = configLoader.getTabs(newState.version)
    setTabs(versionTabs)

    // Handle tab and sidebar updates
    if (versionTabs.length === 0) {
      // No tabs in this version - clear everything
      setCurrentTab('')
      setSidebarItems([])
      setCurrentPath('')
    } else if (newState.tab) {
      // Version has tabs - update tab and sidebar
      setCurrentTab(newState.tab)

      // Update sidebar items when tab changes
      const currentTabObj = versionTabs.find(t => t.tab === newState.tab)
      if (currentTabObj && currentTabObj.items) {
        setSidebarItems(currentTabObj.items)
      } else {
        setSidebarItems([])
      }

      if (newState.page) {
        setCurrentPath(newState.page)
      } else {
        setCurrentPath('')
      }
    }

  }

  const handleTabChange = async (tabName: string) => {
    // Use navigation service to change tab
    const newState = navigationService.changeTab(tabName, currentVersion)

    if (newState.tab) {
      setCurrentTab(newState.tab)
    }

    // Check if this tab has an OpenAPI reference
    const currentTabObj = tabs.find(t => t.tab === tabName)

    if (currentTabObj?.api_reference) {
      // OpenAPI tab - load spec and generate navigation
      setCurrentOpenApiSpec(currentTabObj.api_reference)

      const parsed = await openApiLoader.loadSpec(currentTabObj.api_reference)
      if (parsed) {
        const navItems = openApiLoader.getNavigationItems(currentTabObj.api_reference)
        setSidebarItems(navItems)

        // Set first endpoint as current path
        if (parsed.navigation.length > 0) {
          const firstGroup = parsed.navigation[0]
          if (firstGroup.type === 'group' && firstGroup.children?.[0]?.page) {
            setCurrentPath(firstGroup.children[0].page)
            navigationService.navigateTo(firstGroup.children[0].page, currentVersion, tabName)
          } else if (firstGroup.page) {
            setCurrentPath(firstGroup.page)
            navigationService.navigateTo(firstGroup.page, currentVersion, tabName)
          }
        }
      } else {
        setSidebarItems([])
      }
    } else if (currentTabObj?.items) {
      // Regular tab with static items
      setCurrentOpenApiSpec(undefined)
      setSidebarItems(currentTabObj.items)

      // Use navigation service's page
      if (newState.page) {
        setCurrentPath(newState.page)
      }
    } else {
      setCurrentOpenApiSpec(undefined)
      setSidebarItems([])
    }
  }

  const handleNavigate = (path: string, headingId?: string) => {
    // Use navigation service to navigate
    navigationService.navigateTo(path, currentVersion, currentTab)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'instant' });

    // If headingId is provided, scroll to it after a short delay
    if (headingId) {
      setTimeout(() => {
        const element = document.getElementById(headingId)
        if (element) {
          // Scroll to element with smooth behavior
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Add highlight effect
          element.style.transition = 'background-color 0.3s ease'
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'

          setTimeout(() => {
            element.style.backgroundColor = ''
          }, 2000)
        }
      }, 300)
    }
  }


  const findPage = (item:NavigationItem,page:string):string|null=>{
    if(item.type!="page"&& item.type!="openapi"){
     return (item as NavigationDropdown|NavigationGroup).children.map(ch=>findPage(ch,page)).filter(res=>!!res).pop()||null
    }
    const item_page = (item as NavigationPage)
    if(item_page.title == page ||  item_page.page.split('/').includes(`${page}.mdx`)){
      return item_page.page
    }
    return null
  }
  const handleSearchNavigate=(pageName:string,headingId?:string,tab?:string,version?:string)=>{
    // Filter out 'default' version as it's the implicit version when no versions exist
    const actualVersion = version?.toLowerCase() === 'default' ? undefined : version
    let path = FindPagePathByName(pageName, tab, actualVersion) || '/'
    if(actualVersion){
      handleVersionChange(actualVersion)
    }
    if(tab){
      handleTabChange(tab)
    }

    navigationService.navigateTo(path, actualVersion, tab)
    setCurrentPath(path)

    if (headingId) {
      setTimeout(() => {
        const element = document.getElementById(headingId)
        if (element) {
          // Scroll to element with smooth behavior
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })

          // Add highlight effect
          element.style.transition = 'background-color 0.3s ease'
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'

          setTimeout(() => {
            element.style.backgroundColor = ''
          }, 2000)
        }
      }, 300)
    }


  }


  const toggleDevMode = () => {
    setIsDevMode(prev => !prev)
  }

  // Find current group and page names for mobile breadcrumb
  const getCurrentGroupAndPage = (): { groupName: string | undefined, pageName: string | undefined } => {
    if (!currentPath || sidebarItems.length === 0) {
      return { groupName: undefined, pageName: undefined }
    }

    // Helper to compare paths (normalize both for comparison)
    const pathsMatch = (pagePath: string, targetPath: string): boolean => {
      if (!pagePath || !targetPath) return false
      // Normalize paths: remove leading/trailing slashes
      const normalize = (p: string) => p.replace(/^\/+|\/+$/g, '').toLowerCase()
      const normalizedPagePath = normalize(pagePath)
      const normalizedTargetPath = normalize(targetPath)

      // Direct match
      if (normalizedPagePath === normalizedTargetPath) return true

      // Check if pagePath ends with targetPath (handles version prefix)
      // e.g., "v10.9.5/documentation/intro/page.mdx" ends with "documentation/intro/page.mdx"
      if (normalizedPagePath.endsWith(normalizedTargetPath)) return true

      return false
    }

    for (const item of sidebarItems) {
      if ((item.type === 'group' || item.type === 'dropdown') && item.children) {
        for (const child of item.children) {
          if (child.type === 'page') {
            const pagePath = (child as NavigationPage).page
            if (pathsMatch(pagePath, currentPath)) {
              return { groupName: item.title, pageName: child.title }
            }
          }
          // Check nested children (dropdowns inside groups)
          if ((child.type === 'group' || child.type === 'dropdown') && child.children) {
            for (const nestedChild of child.children) {
              if (nestedChild.type === 'page') {
                const pagePath = (nestedChild as NavigationPage).page
                if (pathsMatch(pagePath, currentPath)) {
                  return { groupName: child.title, pageName: nestedChild.title }
                }
              }
            }
          }
        }
      } else if (item.type === 'page') {
        const pagePath = (item as NavigationPage).page
        if (pathsMatch(pagePath, currentPath)) {
          return { groupName: undefined, pageName: item.title }
        }
      }
    }

    return { groupName: undefined, pageName: undefined }
  }

  const { groupName: currentGroup, pageName: currentPage } = getCurrentGroupAndPage()

  const toggleSettingsSidebar = () => {
    setIsSettingsSidebarOpen(prev => !prev)
  }

  const passContextoAi=(contextText:string,intention:string)=>{
    const currentFileName = window.location.href.replace(window.location.origin,"");

    const currentFileContext:ChatContext= {
        id: `current_file-${Date.now()}`,
        type:  'file',
        fileName: currentFileName
    }
    const textContext:ChatContext= {
        id: `selelected-${Date.now()}`,
        type:  'text',
        content:contextText,
        fileName:currentFileName
    }
    const intentionContext:ChatContext= {
        id: `intention`,
        type:  'intention',
        content:intention
    }

    setAiContexts(prevAiContexts => {
      // Remove any existing text and file contexts (replace with new selection)
      const filteredContexts = prevAiContexts.filter(
        context => context.type !== 'text' && context.type !== 'file' && context.type !== 'intention'
      );

      // Add the new contexts
      return [
        ...filteredContexts,
        currentFileContext,
        textContext,
        intentionContext
      ];
    });
  }

  return (
    <TextSelectionContextMenu theme={theme} onAiUpgrade={(selected)=>{passContextoAi(selected,"upgrade")}} onAiChat={(selected)=>{passContextoAi(selected,"ask")}}>
      {/* Main content wrapper that shifts when sidebar is open */}
      <div
        style={{
          marginRight: (isSettingsSidebarOpen || isChatSidebarOpen) ? '450px' : '0',
          transition: 'margin-right 0.3s ease'
        }}
      >
        <Banner theme={theme} />
        <Navbar
          theme={theme}
          onThemeChange={toggleTheme}
          onVersionChange={handleVersionChange}
          currentVersion={currentVersion}
          isDevMode={isProductionMode ? false : isDevMode}
          allowUpload={isDevEnvironment}
          onSearchClick={() => setShowSearchModal(true)}
          onAISearchClick={() => setIsAISearchSidebarOpen(true)}
        />
        {tabs.length > 0 && (
          <TabBar
            tabs={tabs}
            activeTab={currentTab}
            onTabChange={handleTabChange}
            theme={theme}
            primaryColor={primaryColor}
            isDevMode={isProductionMode ? false : isDevMode}
            currentVersion={currentVersion}
            currentGroup={currentGroup}
            currentPage={currentPage}
            onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
          />
        )}

        {(
          !isProductionMode  &&
          <OptionsSidebar theme={theme}>

            <ChatSidebar
              theme={theme}
              externalContexts={aiContexts}
              onUpdateContext={(ctx)=>setAiContexts(ctx)}
              onOpenChange={setIsChatSidebarOpen}
              onContentChange={() => setPageRefreshKey(prev => prev + 1)}
              onOpenSettings={() => setIsSettingsSidebarOpen(true)}
              buttonVisible={!isSettingsSidebarOpen && !isChatSidebarOpen}
              currentVersion={currentVersion}
              currentTab={currentTab}
            />

            <SettingsSidebar
              theme={theme}
              isDevMode={isDevMode}
              onDevModeToggle={toggleDevMode}
              isOpen={isSettingsSidebarOpen}
              onToggle={toggleSettingsSidebar}
              allowUpload={isDevEnvironment}
              buttonVisible={!isSettingsSidebarOpen && !isChatSidebarOpen}
            />
          </OptionsSidebar>
        )}

        {/* Layout with Sidebar, Content, and TOC */}
        <div style={{
          display: 'flex',
          width: '100%',
          maxWidth: '1525px',
          margin: '0 auto',
          padding: '0 20px',
          position: 'relative',
          boxSizing: 'border-box',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
        }}>
        {/* Sidebar - Always render, even if empty */}
        <Sidebar
          items={sidebarItems}
          theme={theme}
          primaryColor={primaryColor}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          isDevMode={isProductionMode ? false : isDevMode}
          currentVersion={currentVersion}
          currentTab={currentTab}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          onThemeChange={toggleTheme}
          versions={versions}
          onVersionChange={handleVersionChange}
          tabs={tabs}
          onTabChange={handleTabChange}
        />

        {/* Main content */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: isMobile ? '4px' : '20px',
          paddingRight: isMobile ? '4px' : '20px',
          paddingTop: isMobile ? '20px' : '40px',
          marginLeft: isMobile ? '0' : '15px',
          minWidth: 0,
          minHeight: 'calc(100vh - var(--navbar-height, 64px) - var(--tabbar-height, 64px) - 40px)',
        }}>
          {/* Page Viewer */}
          <div id="page-content-area" style={{ flex: '1 0 auto' }}>
            <PageViewer key={`${currentPath}-${pageRefreshKey}`} pagePath={currentPath} theme={theme} isDevMode={isProductionMode ? false : isDevMode} allowUpload={isDevEnvironment} openApiSpec={currentOpenApiSpec} />
          </div>

          {/* Prev/Next Navigation */}
          {currentPath && sidebarItems.length > 0 && (
            <PrevNextNavigation
              currentPath={currentPath}
              sidebarItems={sidebarItems}
              onNavigate={handleNavigate}
              theme={theme}
              primaryColor={primaryColor}
            />
          )}

          {/* Footer */}
          <Footer theme={theme} isDevMode={isProductionMode ? false : isDevMode} />
        </div>

        {/* Table of Contents or RightPanel(s) - Hide for API Reference pages */}
        {currentPath && !currentPath.includes('api_reference') && (
          rightPanelContent && rightPanelContent.length > 0 ? (
            <div
              style={{
                width: '450px',
                position: 'sticky',
                top: 'var(--sidebar-top, 128px)',
                height: 'calc(100vh - var(--sidebar-top, 128px))',
                overflowY: 'auto',
              }}
            >
              {rightPanelContent.map((panel, index) => (
                <RightPanel
                  key={panel.attrs?.id || `panel-${index}`}
                  theme={theme}
                  content={panel}
                  isDevMode={isProductionMode ? false : isDevMode}
                />
              ))}
            </div>
          ) : (
            <TOC theme={theme} currentPath={currentPath} />
          )
        )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        visible={showSearchModal}
        onHide={() => setShowSearchModal(false)}
        onNavigate={handleSearchNavigate}
        theme={theme}
        isDevMode={!isProductionMode && isDevMode}
      />

      {/* AI Search Sidebar */}
      {aiSearchConfig && (
        <AISearchSidebar
          config={aiSearchConfig}
          theme={theme}
          primaryColor={primaryColor}
          isOpen={isAISearchSidebarOpen}
          onClose={() => setIsAISearchSidebarOpen(false)}
          isDevMode={!isProductionMode && isDevMode}
        />
      )}
    </TextSelectionContextMenu>
  )
}

export default Documentation
