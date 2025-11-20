import { useState, useEffect, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import type { NavigationItem } from '../types/navigation'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { PageModal } from './PageModal'
import { GroupModal } from './GroupModal'
import { configLoader } from '../services/configLoader'
import { fetchConfig } from '../utils/backendUtils'

interface SidebarProps {
  items: NavigationItem[]
  theme: 'light' | 'dark'
  primaryColor: string
  currentPath?: string
  onNavigate?: (path: string) => void
  isDevMode?: boolean
  currentVersion?: string
  currentTab?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  theme,
  primaryColor,
  currentPath = '',
  onNavigate,
  isDevMode = false,
  currentVersion = '',
  currentTab = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  // Dev mode states
  const [editingPagePath, setEditingPagePath] = useState<string | null>(null)
  const [editingPageTitle, setEditingPageTitle] = useState('')
  const [editingGroupTitle, setEditingGroupTitle] = useState<string | null>(null)
  const [editingGroupNewTitle, setEditingGroupNewTitle] = useState('')
  const [hoveredPagePath, setHoveredPagePath] = useState<string | null>(null)
  const [hoveredGroupTitle, setHoveredGroupTitle] = useState<string | null>(null)
  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null)
  const [draggedPagePath, setDraggedPagePath] = useState<string | null>(null)
  const [draggedPageGroupTitle, setDraggedPageGroupTitle] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingItemType, setDeletingItemType] = useState<'page' | 'group'>('page')
  const [deletingItemName, setDeletingItemName] = useState('')
  const [deletingItemPath, setDeletingItemPath] = useState<string | null>(null)
  const [deletingGroupTitle, setDeletingGroupTitle] = useState<string | null>(null)
  const [showPageModal, setShowPageModal] = useState(false)
  const [pageModalGroupTitle, setPageModalGroupTitle] = useState('')
  const [showGroupModal, setShowGroupModal] = useState(false)

  // Check if current tab is API Reference
  const isAPIReferenceTab = (): boolean => {
    const normalized = currentTab.toLowerCase()
    return normalized === 'api reference'
  }

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '59, 130, 246'
  }

  const primaryRgb = hexToRgb(primaryColor)

  const methodColors: Record<string, string> = {
    GET: 'linear-gradient(135deg, #10b981, #059669)',
    POST: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    PUT: 'linear-gradient(135deg, #f59e0b, #d97706)',
    DELETE: 'linear-gradient(135deg, #ef4444, #dc2626)',
    PATCH: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  }

  const toggleDropdown = (title: string) => {
    const newOpenDropdowns = new Set(openDropdowns)
    if (newOpenDropdowns.has(title)) {
      newOpenDropdowns.delete(title)
    } else {
      newOpenDropdowns.add(title)
    }
    setOpenDropdowns(newOpenDropdowns)
  }

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    }
    // Close mobile sidebar after navigation
    if (isMobile) {
      setIsOpen(false)
    }
  }

  // Helper: Get current tab's items from config (supports both versions and direct tabs)
  const getTabItems = (config: any): any[] | null => {
    // Try versions structure first
    if (config.navigation?.versions) {
      const versionIndex = config.navigation.versions.findIndex(
        (v: any) => v.version === currentVersion
      )

      if (versionIndex !== -1) {
        const tabs = config.navigation.versions[versionIndex].tabs
        const tabIndex = tabs?.findIndex((t: any) => t.tab === currentTab)

        if (tabIndex !== -1 && tabIndex !== undefined) {
          return tabs[tabIndex].items || []
        }
      }
    }

    // Try direct tabs structure
    if (config.navigation?.tabs) {
      const tabIndex = config.navigation.tabs.findIndex((t: any) => t.tab === currentTab)

      if (tabIndex !== -1) {
        return config.navigation.tabs[tabIndex].items || []
      }
    }

    return null
  }

  // Helper function to generate page path
  const generatePagePath = (groupTitle: string, pageTitle: string): string => {
    const sanitize = (str: string) => str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    return `/${currentVersion}/${sanitize(currentTab)}/${sanitize(groupTitle)}/${sanitize(pageTitle)}.mdx`
  }

  // Handle page title edit (double-click)
  const handlePageDoubleClick = (pagePath: string, currentTitle: string) => {
    if (isDevMode && !isAPIReferenceTab()) {
      setEditingPagePath(pagePath)
      setEditingPageTitle(currentTitle)
    }
  }

  // Save edited page title
  const handleSavePageTitle = async () => {
    if (!editingPagePath) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Find the page and its group to calculate new path
      let groupTitle = ''
      let newPagePath = editingPagePath

      // Use helper to access tab items (works for both versions and direct tabs)
      const items = getTabItems(config)
      if (items) {
        for (const group of items) {
          if (group.children) {
            const pageIndex = group.children.findIndex((p: any) => p.page === editingPagePath)
            if (pageIndex !== -1) {
              groupTitle = group.title
              // Calculate new page path based on new title
              newPagePath = generatePagePath(groupTitle, editingPageTitle)

              // Update title and path in config
              group.children[pageIndex].title = editingPageTitle
              group.children[pageIndex].page = newPagePath
              break
            }
          }
        }
      }

      // If the path changed, rename the file on the backend
      if (editingPagePath !== newPagePath) {
        const renameResponse = await fetch(`${backendUrl}/files/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_path: editingPagePath,
            new_path: newPagePath
          }),
        })

        if (!renameResponse.ok) {
          const errorData = await renameResponse.text()
          throw new Error(`Failed to rename file: ${errorData}`)
        }

      }

      // Save config with updated title and path
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save page title')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setEditingPagePath(null)
      setEditingPageTitle('')

      // If current path is the edited page, update it
      if (currentPath === editingPagePath && onNavigate) {
        onNavigate(newPagePath)
      }
    } catch (error) {
      console.error('[Sidebar] Error saving page title:', error)
    }
  }

  // Handle page delete click
  const handlePageDeleteClick = (pagePath: string, pageTitle: string) => {
    setDeletingItemType('page')
    setDeletingItemName(pageTitle)
    setDeletingItemPath(pagePath)
    setShowDeleteModal(true)
  }

  // Delete page
  const handleDeletePage = async () => {
    if (!deletingItemPath) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Find and remove the page using helper
      const items = getTabItems(config)
      if (items) {
        for (const group of items) {
          if (group.children) {
            const pageIndex = group.children.findIndex((p: any) => p.page === deletingItemPath)
            if (pageIndex !== -1) {
              group.children.splice(pageIndex, 1)
              break
            }
          }
        }
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to delete page')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error deleting page:', error)
    }
  }

  // Add new page to group
  const handleAddNewPage = async (pageName: string) => {
    if (!pageModalGroupTitle) return

    const newPagePath = generatePagePath(pageModalGroupTitle, pageName)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Validate that page doesn't already exist in this group using helper
      const items = getTabItems(config)
      if (items) {
        for (const group of items) {
          if (group.title === pageModalGroupTitle && group.children) {
            // Check if page with same name already exists
            const existingPage = group.children.find((p: any) => p.title === pageName)
            if (existingPage) {
              throw new Error(`A page named "${pageName}" already exists in this group`)
            }

            const newPage = {
              title: pageName,
              page: newPagePath,
              type: 'page'
            }
            group.children.push(newPage)
            break
          }
        }
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save new page')
      }

      // Create the JSON file with initial TipTap content structure
      const jsonPath = newPagePath.replace('.mdx', '.json')
      const initialContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [
                {
                  type: 'text',
                  text: pageName
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is a new page. Start editing to add your content.'
                }
              ]
            }
          ]
        }
      }

      const createFileResponse = await fetch(`${backendUrl}/docs${jsonPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(initialContent, null, 2) }),
      })

      if (!createFileResponse.ok) {
        throw new Error('Failed to create JSON file')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error adding new page:', error)
    }
  }

  // Handle group title edit (double-click)
  const handleGroupDoubleClick = (groupTitle: string) => {
    if (isDevMode && !isAPIReferenceTab()) {
      setEditingGroupTitle(groupTitle)
      setEditingGroupNewTitle(groupTitle)
    }
  }

  // Save edited group title
  const handleSaveGroupTitle = async () => {
    if (!editingGroupTitle) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Find and update the group title using helper
      const items = getTabItems(config)
      if (items) {
        for (const group of items) {
          if (group.title === editingGroupTitle) {
            group.title = editingGroupNewTitle
            break
          }
        }
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save group title')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setEditingGroupTitle(null)
      setEditingGroupNewTitle('')
    } catch (error) {
      console.error('[Sidebar] Error saving group title:', error)
    }
  }

  // Handle group delete click
  const handleGroupDeleteClick = (groupTitle: string) => {
    setDeletingItemType('group')
    setDeletingItemName(groupTitle)
    setDeletingGroupTitle(groupTitle)
    setShowDeleteModal(true)
  }

  // Delete group
  const handleDeleteGroup = async () => {
    if (!deletingGroupTitle) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Find and remove the group using helper
      const items = getTabItems(config)
      if (items) {
        const groupIndex = items.findIndex((g: any) => g.title === deletingGroupTitle)
        if (groupIndex !== -1) {
          items.splice(groupIndex, 1)
        }
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to delete group')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error deleting group:', error)
    }
  }

  // Add new group
  const handleAddNewGroup = async (groupName: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Validate that group doesn't already exist using helper
      const items = getTabItems(config)
      if (items) {
        // Check if group with same name already exists
        const existingGroup = items.find((g: any) => g.title === groupName)
        if (existingGroup) {
          throw new Error(`A group named "${groupName}" already exists in this tab`)
        }

        const newGroup = {
          title: groupName,
          type: 'group',
          children: []
        }
        items.push(newGroup)
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save new group')
      }

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error adding new group:', error)
    }
  }

  // Drag and drop handlers for groups
  const handleGroupDragStart = (index: number) => {
    if (isDevMode && !isAPIReferenceTab()) {
      setDraggedGroupIndex(index)
    }
  }

  const handleGroupDragOver = (e: React.DragEvent) => {
    if (isDevMode && !isAPIReferenceTab()) {
      e.preventDefault()
    }
  }

  const handleGroupDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!isDevMode || !isAPIReferenceTab() === false || draggedGroupIndex === null || draggedGroupIndex === dropIndex) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Reorder groups using helper
      const items = getTabItems(config)
      if (items) {
        const [draggedGroup] = items.splice(draggedGroupIndex, 1)
        items.splice(dropIndex, 0, draggedGroup)
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to reorder groups')
      }

      // Reset drag states first, before updating config
      setDraggedGroupIndex(null)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error reordering groups:', error)
      setDraggedGroupIndex(null)
    }
  }

  // Drag and drop handlers for pages within a group
  const handlePageDragStart = (pagePath: string, groupTitle: string) => {
    if (isDevMode && !isAPIReferenceTab()) {
      setDraggedPagePath(pagePath)
      setDraggedPageGroupTitle(groupTitle)
    }
  }

  const handlePageDragOver = (e: React.DragEvent) => {
    if (isDevMode && !isAPIReferenceTab()) {
      e.preventDefault()
    }
  }

  const handlePageDrop = async (e: React.DragEvent, dropPagePath: string, dropGroupTitle: string) => {
    e.preventDefault()

    if (!isDevMode || isAPIReferenceTab() || !draggedPagePath || !draggedPageGroupTitle || draggedPagePath === dropPagePath) return

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

      // Fetch current config
      const config = await fetchConfig()

      // Reorder pages within the same group using helper
      const items = getTabItems(config)
      if (items) {
        // Only allow reordering within the same group
        if (draggedPageGroupTitle === dropGroupTitle) {
          for (const group of items) {
            if (group.title === draggedPageGroupTitle && group.children) {
              const draggedIndex = group.children.findIndex((p: any) => p.page === draggedPagePath)
              const dropIndex = group.children.findIndex((p: any) => p.page === dropPagePath)

              if (draggedIndex !== -1 && dropIndex !== -1) {
                const [draggedPage] = group.children.splice(draggedIndex, 1)
                group.children.splice(dropIndex, 0, draggedPage)
              }
              break
            }
          }
        }
      }

      // Save config
      const saveResponse = await fetch(`${backendUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to reorder pages')
      }

      // Reset drag states first, before updating config
      setDraggedPagePath(null)
      setDraggedPageGroupTitle(null)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[Sidebar] Error reordering pages:', error)
      setDraggedPagePath(null)
      setDraggedPageGroupTitle(null)
    }
  }

  const renderNestedItem = (item: NavigationItem, depth: number = 0, parentGroupTitle: string = ''): ReactElement | null => {
    const paddingLeft = depth * 16

    switch (item.type) {
      case 'group':
        const isEditingGroup = editingGroupTitle === item.title
        const isHoveringGroup = hoveredGroupTitle === item.title
        const groupIndex = items.findIndex(i => i.title === item.title)

        return (
          <div
            key={item.title}
            draggable={isDevMode && !isAPIReferenceTab() && !isEditingGroup}
            onDragStart={() => handleGroupDragStart(groupIndex)}
            onDragOver={handleGroupDragOver}
            onDrop={(e) => handleGroupDrop(e, groupIndex)}
            onDragEnd={() => setDraggedGroupIndex(null)}
            style={{
              marginBottom: '32px',
              cursor: isDevMode && !isAPIReferenceTab() && !isEditingGroup ? 'move' : 'default',
              opacity: draggedGroupIndex === groupIndex ? 0.5 : 1
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
              }}
              onMouseEnter={() => {
                if (isDevMode && !isAPIReferenceTab()) {
                  setHoveredGroupTitle(item.title)
                }
              }}
              onMouseLeave={() => {
                if (isDevMode && !isAPIReferenceTab()) {
                  setHoveredGroupTitle(null)
                }
              }}
            >
              {/* Delete button - Only in Dev Mode */}
              {isDevMode && !isAPIReferenceTab() && isHoveringGroup && !isEditingGroup && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGroupDeleteClick(item.title)
                  }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
                    border: `1px solid ${theme === 'light' ? '#fecaca' : '#991b1b'}`,
                    color: theme === 'light' ? '#ef4444' : '#fca5a5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    transition: 'all 0.2s',
                    padding: 0,
                    zIndex: 10001,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Delete group"
                >
                  <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                </button>
              )}

              {isEditingGroup ? (
                <input
                  type="text"
                  value={editingGroupNewTitle}
                  onChange={(e) => setEditingGroupNewTitle(e.target.value)}
                  onBlur={handleSaveGroupTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveGroupTitle()
                    } else if (e.key === 'Escape') {
                      setEditingGroupTitle(null)
                      setEditingGroupNewTitle('')
                    }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    paddingLeft: '8px',
                    padding: '4px 8px',
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                    color: theme === 'light' ? '#6b7280' : '#9ca3af',
                  }}
                />
              ) : (
                <div
                  onDoubleClick={() => {
                    if (isDevMode && !isAPIReferenceTab()) {
                      handleGroupDoubleClick(item.title)
                    }
                  }}
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    paddingLeft: '8px',
                    borderLeft: `0px solid rgba(${primaryRgb}, 0.5)`,
                    color: theme === 'light' ? '#6b7280' : '#9ca3af',
                    textAlign: 'left',
                    cursor: isDevMode && !isAPIReferenceTab() ? 'pointer' : 'default',
                  }}
                >
                  {item.title}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '0' }}>
              {item.children?.map(child => renderNestedItem(child, 1, item.title))}

              {/* Add New Page button - Only in Dev Mode */}
              {isDevMode && !isAPIReferenceTab() && (
                <button
                  onClick={() => {
                    setPageModalGroupTitle(item.title)
                    setShowPageModal(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    marginTop: '4px',
                    marginLeft: '16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: primaryColor,
                    backgroundColor: 'transparent',
                    border: `1px dashed ${primaryColor}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `rgba(${primaryRgb}, 0.05)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                  title="Add new page"
                >
                  <i className="pi pi-plus" style={{ fontSize: '10px' }}></i>
                  <span>Add Page</span>
                </button>
              )}
            </div>
          </div>
        )

      case 'dropdown':
        const isDropdownOpen = openDropdowns.has(item.title)
        return (
          <div key={item.title} style={{ paddingLeft: `${paddingLeft}px` }}>
            <button
              onClick={() => toggleDropdown(item.title)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: '600',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                background: 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, rgba(${primaryRgb}, 0.05), rgba(${primaryRgb}, 0.08))`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>{item.title}</span>
              <i
                className={`pi ${isDropdownOpen ? 'pi-chevron-down' : 'pi-chevron-right'}`}
                style={{ fontSize: '13px', transition: 'transform 0.2s' }}
              />
            </button>
            {isDropdownOpen && (
              <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: `2px solid rgba(${primaryRgb}, 0.2)`, marginLeft: '12px' }}>
                {item.children?.map(child => renderNestedItem(child, 1))}
              </div>
            )}
          </div>
        )

      case 'page':
        const isActive = item.page === currentPath
        const isEditingThis = editingPagePath === item.page
        const isHovering = hoveredPagePath === item.page

        return (
          <div
            key={item.page + item.title}
            draggable={isDevMode && !isAPIReferenceTab() && !isEditingThis}
            onDragStart={() => handlePageDragStart(item.page || '', parentGroupTitle)}
            onDragOver={handlePageDragOver}
            onDrop={(e) => handlePageDrop(e, item.page || '', parentGroupTitle)}
            onDragEnd={() => {
              setDraggedPagePath(null)
              setDraggedPageGroupTitle(null)
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              cursor: isDevMode && !isAPIReferenceTab() && !isEditingThis ? 'move' : 'default',
              opacity: draggedPagePath === item.page ? 0.5 : 1
            }}
            onMouseEnter={() => {
              if (isDevMode && !isAPIReferenceTab()) {
                setHoveredPagePath(item.page || null)
              }
            }}
            onMouseLeave={() => {
              if (isDevMode && !isAPIReferenceTab()) {
                setHoveredPagePath(null)
              }
            }}
          >
            {/* Delete button - Only in Dev Mode */}
            {isDevMode && !isAPIReferenceTab() && isHovering && !isEditingThis && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handlePageDeleteClick(item.page || '', item.title)
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
                  border: `1px solid ${theme === 'light' ? '#fecaca' : '#991b1b'}`,
                  color: theme === 'light' ? '#ef4444' : '#fca5a5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  transition: 'all 0.2s',
                  padding: 0,
                  zIndex: 10001,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                title="Delete page"
              >
                <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
              </button>
            )}

            {isEditingThis ? (
              <input
                type="text"
                value={editingPageTitle}
                onChange={(e) => setEditingPageTitle(e.target.value)}
                onBlur={handleSavePageTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSavePageTitle()
                  } else if (e.key === 'Escape') {
                    setEditingPagePath(null)
                    setEditingPageTitle('')
                  }
                }}
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  paddingLeft: `${paddingLeft + 16}px`,
                  fontSize: '15px',
                  fontWeight: '600',
                  border: `2px solid ${primaryColor}`,
                  borderRadius: '12px',
                  outline: 'none',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                  color: theme === 'light' ? '#111827' : '#f9fafb',
                }}
              />
            ) : (
              <a
                href={item.page || '#'}
                onClick={(e) => {
                  e.preventDefault()
                  if (item.page) {
                    handleNavigate(item.page)
                  }
                }}
                onDoubleClick={(e) => {
                  if (isDevMode && !isAPIReferenceTab()) {
                    e.preventDefault()
                    handlePageDoubleClick(item.page || '', item.title)
                  }
                }}
                style={{
                  flex: 1,
                  display: 'block',
                  padding: '12px 16px',
                  paddingLeft: `${paddingLeft + 16}px`,
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? `rgb(${primaryRgb})` : (theme === 'light' ? '#374151' : '#d1d5db'),
                  background: isActive ? `linear-gradient(135deg, rgba(${primaryRgb}, 0.15), rgba(${primaryRgb}, 0.1))` : 'transparent',
                  border: isActive ? `1px solid rgba(${primaryRgb}, 0.3)` : '1px solid transparent',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 2px 8px rgba(${primaryRgb}, 0.15)` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `linear-gradient(to right, rgba(${primaryRgb}, 0.05), rgba(${primaryRgb}, 0.03))`
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {item.title}
              </a>
            )}
          </div>
        )

      case 'openapi':
      case 'swagger':
        const isApiActive = item.page === currentPath
        return (
          <a
            key={item.page + item.title}
            href={item.page || '#'}
            onClick={(e) => {
              e.preventDefault()
              if (item.page) {
                handleNavigate(item.page)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              paddingLeft: `${paddingLeft + 16}px`,
              fontSize: '15px',
              fontWeight: isApiActive ? '600' : '500',
              color: isApiActive ? `rgb(${primaryRgb})` : (theme === 'light' ? '#374151' : '#d1d5db'),
              background: isApiActive ? `linear-gradient(135deg, rgba(${primaryRgb}, 0.15), rgba(${primaryRgb}, 0.1))` : 'transparent',
              border: isApiActive ? `1px solid rgba(${primaryRgb}, 0.3)` : '1px solid transparent',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: isApiActive ? `0 2px 8px rgba(${primaryRgb}, 0.15)` : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (!isApiActive) {
                e.currentTarget.style.background = `linear-gradient(to right, rgba(${primaryRgb}, 0.05), rgba(${primaryRgb}, 0.03))`
                e.currentTarget.style.transform = 'scale(1.02)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isApiActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#ffffff',
                background: methodColors[item.method] || methodColors.GET,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            >
              {item.method}
            </span>
            <span style={{ flexGrow: 1, minWidth: 0 }}>{item.title}</span>
          </a>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <i className="pi pi-bars" style={{ fontSize: '20px' }} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? '0' : 'var(--sidebar-top, 128px)',
          left: isMobile && !isOpen ? '-100%' : '0',
          height: isMobile ? '100vh' : 'calc(100vh - var(--sidebar-top, 128px))',
          width: '280px',
          minWidth: '280px',
          maxWidth: '280px',
          overflowY: 'auto',
          padding: '0px 16px 24px 0px',
          flexShrink: 0,
          zIndex: isMobile ? 1100 : 10,
          transition: isMobile ? 'left 0.3s ease-in-out' : 'none',
          borderRight: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          backgroundColor: isMobile
            ? (theme === 'light' ? '#ffffff' : '#111827')
            : 'transparent',
          backdropFilter: isMobile ? 'blur(8px)' : 'none',
          alignSelf: 'flex-start',
          willChange: 'position',
        }}
      >
        {/* Mobile close button */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme === 'light' ? '#6b7280' : '#9ca3af'
              }}
            >
              <i className="pi pi-times" style={{ fontSize: '20px' }} />
            </button>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '16px' }}>
          {items.map(item => renderNestedItem(item, 0))}

          {/* Add New Group button - Only in Dev Mode and when there's a tab */}
          {isDevMode && !isAPIReferenceTab() && currentTab && (
            <button
              onClick={() => setShowGroupModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                marginTop: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: primaryColor,
                backgroundColor: 'transparent',
                border: `2px dashed ${primaryColor}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `rgba(${primaryRgb}, 0.05)`
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              title="Add new group"
            >
              <i className="pi pi-plus" style={{ fontSize: '12px' }}></i>
              <span>Add New Group</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050
          }}
        />
      )}

      {/* Delete Confirmation Modal - Rendered outside using Portal */}
      {showDeleteModal && deletingItemName && createPortal(
        <DeleteConfirmModal
          theme={theme}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingItemType('page')
            setDeletingItemName('')
            setDeletingItemPath(null)
            setDeletingGroupTitle(null)
          }}
          onConfirm={deletingItemType === 'page' ? handleDeletePage : handleDeleteGroup}
          itemName={deletingItemName}
          itemType={deletingItemType}
        />,
        document.body
      )}

      {/* Page Modal - Rendered outside using Portal */}
      {showPageModal && createPortal(
        <PageModal
          theme={theme}
          groupTitle={pageModalGroupTitle}
          onClose={() => {
            setShowPageModal(false)
            setPageModalGroupTitle('')
          }}
          onConfirm={handleAddNewPage}
        />,
        document.body
      )}

      {/* Group Modal - Rendered outside using Portal */}
      {showGroupModal && createPortal(
        <GroupModal
          theme={theme}
          onClose={() => setShowGroupModal(false)}
          onConfirm={handleAddNewGroup}
        />,
        document.body
      )}
    </>
  )
}
