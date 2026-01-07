import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { configLoader } from '../../services/configLoader'
import { useConfig } from '../hooks/useConfig'
import { ContentService } from '../../services/contentService'

interface FooterItem {
  type: string
  reference: string
}

interface FooterProps {
  theme: 'light' | 'dark'
  isDevMode?: boolean
}

export const Footer: React.FC<FooterProps> = ({ theme, isDevMode = false }) => {
  const { updateTrigger } = useConfig()
  const [siteName, setSiteName] = useState('')
  const [footerItems, setFooterItems] = useState<FooterItem[]>([])
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingType, setEditingType] = useState('')
  const [editingReference, setEditingReference] = useState('')
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [isEditingSiteName, setIsEditingSiteName] = useState(false)
  const [editingSiteNameValue, setEditingSiteNameValue] = useState('')
  const [colors, setColors] = useState({
    text: '',
    secondaryText: '',
    border: ''
  })

  useEffect(() => {
    const config = configLoader.getConfig()
    if (config) {
      setSiteName(configLoader.getName())
      setFooterItems(configLoader.getFooterItems())
      setColors({
        text: configLoader.getTextColor(theme),
        secondaryText: configLoader.getSecondaryTextColor(theme),
        border: theme === 'light' ? '#e5e7eb' : '#4b5563'
      })
    }
  }, [theme, updateTrigger])

  const handleSiteNameDoubleClick = () => {
    if (isDevMode) {
      setIsEditingSiteName(true)
      setEditingSiteNameValue(siteName)
    }
  }

  const handleSiteNameSave = async () => {
    try {
      // Fetch current config
      const config = await configLoader.loadConfig()
      // Update site name
      config.name = editingSiteNameValue

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      setSiteName(editingSiteNameValue)
      setIsEditingSiteName(false)
      setEditingSiteNameValue('')
    } catch (error) {
      console.error('[Footer] Error saving site name:', error)
    }
  }

  const handleSiteNameCancel = () => {
    setIsEditingSiteName(false)
    setEditingSiteNameValue('')
  }

  const currentYear = new Date().getFullYear()

  const handleItemDoubleClick = (index: number, item: FooterItem) => {
    if (isDevMode) {
      setEditingItemIndex(index)
      setEditingType(item.type)
      setEditingReference(item.reference)
    }
  }

  const handleAddNewItem = () => {
    if (footerItems.length >= 5) {
      alert('Maximum 5 footer items allowed')
      return
    }
    setEditingItemIndex(-1) // -1 indicates new item
    setEditingType('github')
    setEditingReference('')
  }

  const handleDeleteItem = async (index: number) => {
    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Remove the footer item
      if (config.footer) {
        config.footer.splice(index, 1)
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      const updatedFooterItems = [...footerItems]
      updatedFooterItems.splice(index, 1)
      setFooterItems(updatedFooterItems)
    } catch (error) {
      console.error('[Footer] Error deleting footer item:', error)
    }
  }

  const handleSaveItem = async () => {
    if (editingItemIndex === null) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      if (!config.footer) {
        config.footer = []
      }

      const newItem = {
        type: editingType,
        reference: editingReference
      }

      if (editingItemIndex === -1) {
        // Add new item
        config.footer.push(newItem)
      } else {
        // Update existing item
        if (config.footer[editingItemIndex]) {
          config.footer[editingItemIndex] = newItem
        }
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      const updatedFooterItems = [...footerItems]
      if (editingItemIndex === -1) {
        updatedFooterItems.push(newItem)
      } else {
        updatedFooterItems[editingItemIndex] = newItem
      }
      setFooterItems(updatedFooterItems)

      // Close editing
      setEditingItemIndex(null)
      setEditingType('')
      setEditingReference('')
    } catch (error) {
      console.error('[Footer] Error saving footer item:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingItemIndex(null)
    setEditingType('')
    setEditingReference('')
  }

  const handleDragStart = (index: number) => {
    if (isDevMode) {
      setDraggedItemIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    if (isDevMode) {
      e.preventDefault()
    }
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!isDevMode || draggedItemIndex === null || draggedItemIndex === dropIndex) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Reorder items
      const updatedFooterItems = [...footerItems]
      const [draggedItem] = updatedFooterItems.splice(draggedItemIndex, 1)
      updatedFooterItems.splice(dropIndex, 0, draggedItem)

      // Update config
      config.footer = updatedFooterItems

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      setFooterItems(updatedFooterItems)
      setDraggedItemIndex(null)
    } catch (error) {
      console.error('[Footer] Error reordering footer items:', error)
      setDraggedItemIndex(null)
    }
  }

  return (
    <>
      <footer
        style={{
          borderTop: `0.5px solid ${colors.border}`,
          padding: '24px 32px',
          marginTop: '60px',
          minHeight: '120px', // Reserve space to prevent layout shift
          contain: 'layout' // Prevent layout from affecting other elements
      }}
    >
      <div
        style={{
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Site name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isEditingSiteName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={editingSiteNameValue}
                  onChange={(e) => setEditingSiteNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSiteNameSave()
                    } else if (e.key === 'Escape') {
                      handleSiteNameCancel()
                    }
                  }}
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.text,
                    backgroundColor: 'transparent',
                    border: `1px solid ${colors.text}`,
                    borderRadius: '4px',
                    padding: '4px 8px',
                    outline: 'none'
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSiteNameSave}
                  style={{
                    padding: '4px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Save"
                >
                  <i className="pi pi-check"></i>
                </button>
                <button
                  onClick={handleSiteNameCancel}
                  style={{
                    padding: '4px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Cancel"
                >
                  <i className="pi pi-times"></i>
                </button>
              </div>
            ) : (
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.text,
                  cursor: isDevMode ? 'pointer' : 'default',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onDoubleClick={handleSiteNameDoubleClick}
                onMouseEnter={(e) => {
                  if (isDevMode) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDevMode) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
                title={isDevMode ? 'Double-click to edit site name' : ''}
              >
                {siteName}
              </span>
            )}
          </div>

          {/* Social links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Add Button - Only in Dev Mode and max 5 items */}
            {isDevMode && footerItems.length < 5 && (
              <button
                onClick={handleAddNewItem}
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
                title="Add footer item"
              >
                <i className="pi pi-plus"></i>
              </button>
            )}

            {footerItems.map((item, idx) => {
              // Map social media types to PrimeIcons
              const iconMap: Record<string, string> = {
                'github': 'github',
                'linkedin': 'linkedin',
                'x': 'twitter',
                'facebook': 'facebook',
                'youtube': 'youtube',
                'instagram': 'instagram',
                'link': 'link'
              }
              const iconName = iconMap[item.type.toLowerCase()] || 'link'

              return (
                <div
                  key={idx}
                  draggable={isDevMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: isDevMode ? 'move' : 'default',
                    opacity: draggedItemIndex === idx ? 0.5 : 1
                  }}
                  onMouseEnter={() => setHoveredItemIndex(idx)}
                  onMouseLeave={() => setHoveredItemIndex(null)}
                >
                  {/* Delete button - Only in Dev Mode */}
                  {isDevMode && hoveredItemIndex === idx && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteItem(idx)
                      }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
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
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                      title="Delete footer item"
                    >
                      <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                    </button>
                  )}

                  <a
                    href={item.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.type}
                    onClick={(e) => {
                      if (isDevMode) {
                        e.preventDefault()
                      }
                    }}
                    onDoubleClick={(e) => {
                      if (isDevMode) {
                        e.preventDefault()
                        handleItemDoubleClick(idx, item)
                      }
                    }}
                    style={{
                      color: colors.secondaryText,
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isDevMode ? 'pointer' : 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.text
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.secondaryText
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    }}
                  >
                    <i className={`pi pi-${iconName}`} style={{ fontSize: '28px' }} />
                  </a>
                </div>
              )
            })}
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '16px'
          }}
        >
          <small
            style={{
              fontSize: '11px',
              color: colors.secondaryText,
              opacity: 0.6
            }}
          >
            {siteName} © {currentYear} all rights reserved
          </small>
        </div>
      </div>
    </footer>

    {/* Footer Item Editor Modal - Rendered outside using Portal */}
    {editingItemIndex !== null && createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={handleCancelEdit}
      >
        <div
          style={{
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            borderRadius: '12px',
            padding: '32px',
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: theme === 'light' ? '#111827' : '#f9fafb',
              }}
            >
              {editingItemIndex === -1 ? 'Add Footer Item' : 'Edit Footer Item'}
            </h2>
            <button
              onClick={handleCancelEdit}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                fontSize: '24px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="pi pi-times"></i>
            </button>
          </div>

          {/* Content */}
          {/* Type Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme === 'light' ? '#374151' : '#d1d5db',
              marginBottom: '8px',
            }}>
              Social Media Type
            </label>
            <select
              value={editingType}
              onChange={(e) => setEditingType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '6px',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option
                value="github"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'github')}
              >
                GitHub {editingItemIndex === -1 && footerItems.some(item => item.type === 'github') ? '(Already added)' : ''}
              </option>
              <option
                value="linkedin"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'linkedin')}
              >
                LinkedIn {editingItemIndex === -1 && footerItems.some(item => item.type === 'linkedin') ? '(Already added)' : ''}
              </option>
              <option
                value="x"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'x')}
              >
                X (Twitter) {editingItemIndex === -1 && footerItems.some(item => item.type === 'x') ? '(Already added)' : ''}
              </option>
              <option
                value="facebook"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'facebook')}
              >
                Facebook {editingItemIndex === -1 && footerItems.some(item => item.type === 'facebook') ? '(Already added)' : ''}
              </option>
              <option
                value="youtube"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'youtube')}
              >
                YouTube {editingItemIndex === -1 && footerItems.some(item => item.type === 'youtube') ? '(Already added)' : ''}
              </option>
              <option
                value="instagram"
                disabled={editingItemIndex === -1 && footerItems.some(item => item.type === 'instagram')}
              >
                Instagram {editingItemIndex === -1 && footerItems.some(item => item.type === 'instagram') ? '(Already added)' : ''}
              </option>
              <option value="link">Other Link</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: theme === 'light' ? '#374151' : '#d1d5db',
              marginBottom: '8px',
            }}>
              URL
            </label>
            <input
              type="text"
              value={editingReference}
              onChange={(e) => setEditingReference(e.target.value)}
              placeholder="e.g., https://github.com/username"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '6px',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '14px',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancelEdit}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="pi pi-check"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
