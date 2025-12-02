import { useState, useRef, useEffect } from 'react'
import { VersionModal } from './VersionModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { configLoader } from '../services/configLoader'
import { ContentService } from '../services/contentService'

export interface Version {
  version: string
  paths?: string[]
}

interface VersionSwitcherProps {
  versions: Version[]
  currentVersion?: string
  onVersionChange?: (version: string) => void
  theme: 'light' | 'dark'
  isDevMode?: boolean
}

export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({
  versions,
  currentVersion,
  onVersionChange,
  theme,
  isDevMode = false
}) => {
  const [selectedVersion, setSelectedVersion] = useState(currentVersion || versions[0]?.version || '')
  const [isOpen, setIsOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingVersion, setEditingVersion] = useState<string | null>(null)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [draggedVersionIndex, setDraggedVersionIndex] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentVersion) {
      setSelectedVersion(currentVersion)
    }
  }, [currentVersion])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleVersionClick = (version: string) => {
    setSelectedVersion(version)
    setIsOpen(false)
    if (onVersionChange) {
      onVersionChange(version)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const normalizeName=(name: string): string=> {
    name = name.toLowerCase().replace(/ /g, "-");
    const reg = /[^a-z0-9\-._]+/g;
    return name.replace(reg, "");
  }

  const handleAddVersion = async (versionName: string) => {
    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Add new version to navigation.versions
      if (!config.navigation) {
        config.navigation = { versions: [] }
      }
      if (!config.navigation.versions) {
        config.navigation.versions = []
      }

      // Create new version entry with empty tabs
      const newVersion = {
        version: versionName,
        tabs: []
      }

      const path =`${!currentVersion?"":`/${normalizeName(currentVersion)}`}}`;
      ContentService.createEntryFolder(path)

      config.navigation.versions.push(newVersion)

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[VersionSwitcher] Error adding version:', error)
      throw error
    }
  }

  const handleEditVersion = async (newVersionName: string) => {
    if (!editingVersion) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Find and update version name in navigation.versions
      if (config.navigation?.versions) {
        const versionIndex = config.navigation.versions.findIndex(
          (v: Version) => v.version === editingVersion
        )

        if (versionIndex !== -1) {
          config.navigation.versions[versionIndex].version = newVersionName
        }
      }

      const old_path =`${!currentVersion?"":`/${normalizeName(currentVersion)}`}}`;
      const new_path =`${!newVersionName?"":`/${normalizeName(newVersionName)}`}}`;
      ContentService.renameFile(old_path,new_path,"folder")
      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setEditingVersion(null)
    } catch (error) {
      console.error('[VersionSwitcher] Error editing version:', error)
      throw error
    }
  }

  const handleDeleteVersion = async () => {
    if (!deletingVersion) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Remove version from navigation.versions
      if (config.navigation?.versions) {
        config.navigation.versions = config.navigation.versions.filter(
          (v: Version) => v.version !== deletingVersion
        )
      }

      const path =`${!currentVersion?"":`/${normalizeName(currentVersion)}`}}`;
      ContentService.removeItem(path)
      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
    } catch (error) {
      console.error('[VersionSwitcher] Error deleting version:', error)
      throw error
    }
  }

  const handleDragStart = (index: number) => {
    if (isDevMode) {
      setDraggedVersionIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isDevMode) {
      e.preventDefault()
    }
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!isDevMode || draggedVersionIndex === null || draggedVersionIndex === dropIndex) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Reorder versions
      if (config.navigation?.versions) {
        const updatedVersions = [...config.navigation.versions]
        const [draggedVersion] = updatedVersions.splice(draggedVersionIndex, 1)
        updatedVersions.splice(dropIndex, 0, draggedVersion)
        config.navigation.versions = updatedVersions
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory instead of reloading
      configLoader.updateConfig(config)
      setDraggedVersionIndex(null)
    } catch (error) {
      console.error('[VersionSwitcher] Error reordering versions:', error)
      setDraggedVersionIndex(null)
    }
  }

  if (!versions || versions.length === 0) {
    // In dev mode, show button to add first version
    if (isDevMode) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '6px 16px',
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
            title="Add first version"
          >
            <i className="pi pi-plus" style={{ fontSize: '12px' }}></i>
            <span>Add Version</span>
          </button>

          {/* Add Version Modal */}
          {showAddModal && (
            <VersionModal
              theme={theme}
              onClose={() => setShowAddModal(false)}
              onSave={handleAddVersion}
              mode="add"
            />
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
        onClick={handleToggle}
        style={{
          padding: '6px 16px',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          color: theme === 'light' ? '#374151' : '#d1d5db',
          border: `1px solid ${theme === 'light' ? '#d1d5db' : '#374151'}`,
          borderRadius: '9999px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#6366f1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#374151'
        }}
      >
        <span>{selectedVersion}</span>
        <i
          className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`}
          style={{ fontSize: '10px' }}
        />
      </button>

      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 1000,
            minWidth: '100%',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '4px',
            margin: 0,
            listStyle: 'none'
          }}
        >
          {versions.map((versionObj, index) => {
            const isSelected = versionObj.version === selectedVersion
            return (
              <li
                key={versionObj.version}
                draggable={isDevMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  backgroundColor: isSelected
                    ? (theme === 'light' ? '#eff6ff' : '#1e3a5f')
                    : 'transparent',
                  color: isSelected
                    ? (theme === 'light' ? '#1e40af' : '#60a5fa')
                    : (theme === 'light' ? '#374151' : '#d1d5db'),
                  fontWeight: isSelected ? '600' : '400',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  cursor: isDevMode ? 'move' : 'default',
                  opacity: draggedVersionIndex === index ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : '#374151'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span
                  onClick={() => handleVersionClick(versionObj.version)}
                  style={{
                    flex: 1,
                    cursor: 'pointer'
                  }}
                >
                  {versionObj.version}
                </span>

                {/* Edit and Delete buttons - Only in Dev Mode */}
                {isDevMode && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingVersion(versionObj.version)
                        setShowEditModal(true)
                        setIsOpen(false)
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: theme === 'light' ? '#6b7280' : '#9ca3af',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? '#e5e7eb' : '#4b5563'
                        e.currentTarget.style.color = '#3b82f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
                      }}
                      title="Edit version"
                    >
                      <i className="pi pi-pencil" style={{ fontSize: '10px' }}></i>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingVersion(versionObj.version)
                        setShowDeleteModal(true)
                        setIsOpen(false)
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: theme === 'light' ? '#6b7280' : '#9ca3af',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
                      }}
                      title="Delete version"
                    >
                      <i className="pi pi-trash" style={{ fontSize: '10px' }}></i>
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      </div>

      {/* Add Version Button - Only in Dev Mode */}
      {isDevMode && (
        <button
          onClick={() => setShowAddModal(true)}
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
            flexShrink: 0
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
          title="Add new version"
        >
          <i className="pi pi-plus"></i>
        </button>
      )}

      {/* Add Version Modal */}
      {showAddModal && (
        <VersionModal
          theme={theme}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddVersion}
          mode="add"
        />
      )}

      {/* Edit Version Modal */}
      {showEditModal && editingVersion && (
        <VersionModal
          theme={theme}
          onClose={() => {
            setShowEditModal(false)
            setEditingVersion(null)
          }}
          onSave={handleEditVersion}
          existingVersion={editingVersion}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingVersion && (
        <DeleteConfirmModal
          theme={theme}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingVersion(null)
          }}
          onConfirm={handleDeleteVersion}
          itemName={deletingVersion}
          itemType="version"
        />
      )}
    </div>
  )
}
