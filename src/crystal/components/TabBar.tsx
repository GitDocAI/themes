import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { configLoader } from '../../services/configLoader'
import type { Tab } from '../../services/configLoader'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import {  ContentService } from '../../services/contentService'


interface TabBarProps {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabName: string) => void
  theme: 'light' | 'dark'
  primaryColor: string
  isDevMode?: boolean
  currentVersion?: string
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  theme,
  primaryColor,
  isDevMode = false,
  currentVersion
}) => {
  const [selectedTab, setSelectedTab] = useState(activeTab || tabs[0]?.tab || '')
  const [bgColor, setBgColor] = useState('')
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null)
  const [editingTabName, setEditingTabName] = useState('')
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null)
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingTabIndex, setDeletingTabIndex] = useState<number | null>(null)
  const [deletingTabName, setDeletingTabName] = useState<string>('')

  useEffect(() => {
    // Get background color from config
    const backgroundColor = configLoader.getBackgroundColor(theme)
    setBgColor(backgroundColor)
  }, [theme])

  useEffect(() => {
    if (activeTab) {
      setSelectedTab(activeTab)
    } else if (tabs.length > 0 && !selectedTab) {
      setSelectedTab(tabs[0].tab)
    }
  }, [activeTab, tabs, selectedTab])

  const handleTabClick = (tabName: string) => {
    // Normal navigation
    setSelectedTab(tabName)
    if (onTabChange) {
      onTabChange(tabName)
    }
  }

  const handleTabDoubleClick = (tabName: string, index: number) => {
    if (isDevMode && !isAPIReferenceTab(tabName)) {
      // In dev mode, start editing on double click
      setEditingTabIndex(index)
      setEditingTabName(tabName)
    }
  }

  const isAPIReferenceTab = (tabName: string): boolean => {
    const normalized = tabName.toLowerCase()
    return normalized === 'api reference'
  }

  const handleSaveTabName = async () => {
    if (editingTabIndex === null || !currentVersion) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()
      // Find the version and update the tab name
      if (config.navigation?.versions) {
        const versionIndex = config.navigation.versions.findIndex(
          (v: any) => v.version === currentVersion
        )

        if (versionIndex !== -1 && config.navigation.versions[versionIndex].tabs && config.navigation.versions[versionIndex].tabs[editingTabIndex]) {
          config.navigation.versions[versionIndex].tabs[editingTabIndex].tab = editingTabName
        }
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setEditingTabIndex(null)
      setEditingTabName('')
    } catch (error) {
      console.error('[TabBar] Error saving tab name:', error)
    }
  }

  const handleDeleteTabClick = (index: number) => {
    // Show confirmation modal
    const tabToDelete = tabs[index]
    if (tabToDelete) {
      setDeletingTabIndex(index)
      setDeletingTabName(tabToDelete.tab)
      setShowDeleteModal(true)
    }
  }

  const handleDeleteTab = async () => {
    if (deletingTabIndex === null || deletingTabIndex === -1) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()
      // Find the version and remove the tab
      if (config.navigation?.versions) {
        const versionIndex = config.navigation.versions.findIndex(
          (v: any) => v.version === currentVersion
        )

        if (versionIndex !== -1 && config.navigation.versions[versionIndex].tabs) {
          config.navigation.versions[versionIndex].tabs.splice(deletingTabIndex, 1)
        }
      }else if(config.navigation?.tabs){
          config.navigation.tabs.splice(deletingTabIndex, 1)
      }


      const path =`${!currentVersion?"":`/${normalizeName(currentVersion)}`}/${normalizeName(deletingTabName)}`;

      ContentService.removeItem(path)
      // Save config
      await ContentService.saveConfig(config)


      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[TabBar] Error deleting tab:', error)
    }
  }

  const normalizeName=(name: string): string=> {
    name = name.toLowerCase().replace(/ /g, "-");
    const reg = /[^a-z0-9\-._]+/g;
    return name.replace(reg, "");
  }



  const handleAddNewTab = async () => {



    const newTab = {
      tab: `New Tab`,
      items: []
    }
    try {
      // Fetch current config
      const config = await configLoader.loadConfig()
      if(!config.navigation){
          config.navigation={}
      }
      // Find the version and add new tab
      if (config.navigation?.versions) {
        const versionIndex = config.navigation.versions.findIndex(
          (v: any) => v.version === currentVersion
        )
        if (versionIndex !== -1 && config.navigation.versions[versionIndex].tabs) {
          if(config.navigation.versions[versionIndex].tabs.length>=0){
            newTab.tab += ` ${config.navigation.versions[versionIndex].tabs.length}`
          }
          config.navigation.versions[versionIndex].tabs.push(newTab)
        }
      }else{

          if(!config.navigation!.tabs){
            config.navigation!.tabs=[]
          }
          if(config.navigation.tabs.length>=0){
            newTab.tab += ` ${config.navigation.tabs.length}`
          }
        config.navigation?.tabs?.push(newTab)
      }

      // Save config

      const path =`${!currentVersion?"":`/${normalizeName(currentVersion)}`}/${normalizeName(deletingTabName)}`;
      ContentService.createEntryFolder(path)
      await ContentService.saveConfig(config)
      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[TabBar] Error adding new tab:', error)
    }
  }

  const handleDragStart = (index: number) => {
    if (isDevMode) {
      setDraggedTabIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isDevMode) {
      e.preventDefault()
    }
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!isDevMode || draggedTabIndex === null || draggedTabIndex === dropIndex || !currentVersion) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Reorder tabs
      if (config.navigation?.versions) {
        const versionIndex = config.navigation.versions.findIndex(
          (v: any) => v.version === currentVersion
        )

        if (versionIndex !== -1 && config.navigation.versions[versionIndex].tabs) {
          const tabs = config.navigation.versions[versionIndex].tabs
          const [draggedTab] = tabs.splice(draggedTabIndex, 1)
          tabs.splice(dropIndex, 0, draggedTab)
        }
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setDraggedTabIndex(null)
    } catch (error) {
      console.error('[TabBar] Error reordering tabs:', error)
      setDraggedTabIndex(null)
    }
  }

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(255, 255, 255, ${alpha})`
  }

  if (!tabs || tabs.length === 0) {
    // In dev mode, show different UI based on whether there are versions
    if (isDevMode) {
      // If no version is selected (no versions exist), show a message
      if (!currentVersion) {
        return (
          <div
            style={{
              position: 'sticky',
              top: '64px',
              zIndex: 900,
              width: '100%',
              margin: '0',
              backgroundColor: bgColor ? hexToRgba(bgColor, 0.7) : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              paddingTop: '12px',
              paddingBottom: '12px'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '1525px',
                margin: '0 auto',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  padding: '12px 24px',
                  backgroundColor: theme === 'light' ? '#fef3c7' : '#78350f',
                  color: theme === 'light' ? '#92400e' : '#fde68a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="pi pi-info-circle" style={{ fontSize: '14px' }}></i>
                <span>Add versions first to create tabs</span>
              </div>
            </div>
          </div>
        )
      }

      // If version exists but no tabs, show button to add first tab
      return (
        <div
          style={{
            position: 'sticky',
            top: '64px',
            zIndex: 900,
            width: '100%',
            margin: '0',
            backgroundColor: bgColor ? hexToRgba(bgColor, 0.7) : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '1525px',
              margin: '0 auto',
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <button
              onClick={handleAddNewTab}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.4)'
              }}
              title="Add first tab"
            >
              <i className="pi pi-plus" style={{ fontSize: '12px' }}></i>
              <span>Add Tab</span>
            </button>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
    <div
      style={{
        position: 'sticky',
        top: '64px', // Height of navbar
        zIndex: 900,
        width: '100%',
        margin: '0',
        backgroundColor: bgColor ? hexToRgba(bgColor, 0.7) : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingTop: '12px',
        paddingBottom: '8px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1525px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="hide-scrollbar"
      >
        <style>
          {`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .tab-button {
              position: relative;
              padding: 12px 8px;
              background: transparent;
              border: none;
              border-bottom: 3px solid transparent;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              white-space: nowrap;
              transition: all 0.2s ease;
              outline: none;
              -webkit-tap-highlight-color: transparent;
            }
            .tab-button:focus {
              outline: none;
              box-shadow: none;
            }
            .tab-button:focus-visible {
              outline: none;
            }
            .tab-button:hover {
              transform: translateY(-2px);
            }
            .tab-button-active {
              position: relative;
              background: linear-gradient(135deg, ${primaryColor}, ${primaryColor});
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .tab-button-active::after {
              content: '';
              position: absolute;
              bottom: -3px;
              left: -8px;
              right: -8px;
              height: 3px;
              background: linear-gradient(135deg, ${primaryColor}, ${primaryColor});
              border-radius: 2px;
              animation: slideIn 0.3s ease-out;
            }
            @keyframes slideIn {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}
        </style>

        {tabs.map((tabObj, index) => {
          const isActive = tabObj.tab === selectedTab
          const isEditing = editingTabIndex === index

          return (
            <div
              key={tabObj.tab}
              draggable={isDevMode && !isEditing}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onMouseEnter={() => setHoveredTabIndex(index)}
              onMouseLeave={() => setHoveredTabIndex(null)}
              style={{
                position: 'relative',
                display: 'inline-block',
                cursor: isDevMode && !isEditing ? 'move' : 'default',
                opacity: draggedTabIndex === index ? 0.5 : 1
              }}
            >
              {/* Delete button - Only in Dev Mode */}
              {isDevMode && hoveredTabIndex === index && !isEditing && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteTabClick(index)
                  }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
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
                  title="Delete tab"
                >
                  <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                </button>
              )}

              {isEditing ? (
                <input
                  type="text"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  onBlur={handleSaveTabName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTabName()
                    } else if (e.key === 'Escape') {
                      setEditingTabIndex(null)
                      setEditingTabName('')
                    }
                  }}
                  autoFocus
                  style={{
                    padding: '12px 8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                    color: theme === 'light' ? '#111827' : '#f9fafb',
                    minWidth: '150px'
                  }}
                />
              ) : (
                <button
                  onClick={() => handleTabClick(tabObj.tab)}
                  onDoubleClick={() => handleTabDoubleClick(tabObj.tab, index)}
                  className={`tab-button ${isActive ? 'tab-button-active' : ''}`}
                  style={{
                    color: isActive
                      ? primaryColor
                      : theme === 'light'
                      ? '#6b7280'
                      : '#9ca3af'
                  }}
                >
                  {tabObj.tab}
                </button>
              )}
            </div>
          )
        })}

        {/* Add Tab Button - Only in Dev Mode */}
        {isDevMode && (
          <button
            onClick={handleAddNewTab}
            style={{
              padding: '4px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)',
              lineHeight: 1,
              flexShrink: 0,
              alignSelf: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
              e.currentTarget.style.transform = 'scale(1.15)'
              e.currentTarget.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.4)'
            }}
            title="Add new tab"
          >
            <i className="pi pi-plus"></i>
          </button>
        )}
      </div>
    </div>

    {/* Delete Confirmation Modal - Rendered outside using Portal */}
    {showDeleteModal && deletingTabName && createPortal(
      <DeleteConfirmModal
        theme={theme}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingTabIndex(null)
          setDeletingTabName('')
        }}
        onConfirm={handleDeleteTab}
        itemName={deletingTabName}
        itemType="tab"
      />,
      document.body
    )}
    </>
  )
}
