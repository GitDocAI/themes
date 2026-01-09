import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { configLoader, type Version, type AISearchConfig } from '../../services/configLoader'
import { useConfig } from '../hooks/useConfig'
import { VersionSwitcher } from './VersionSwitcher'
import { LogoEditor } from './LogoEditor'
import { Image } from './ui/Image'
import { ContentService } from '../../services/contentService'
import { ProfileMenu } from './ProfileMenu'
import { ProfileModal } from './ProfileModal'
import { AISearchButton } from './AISearchButton'
import authService, { type User } from '../../services/authService'

interface NavbarProps {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onVersionChange?: (version: string) => void
  currentVersion?: string
  isDevMode?: boolean
  allowUpload?: boolean
  onSearchClick?: () => void
  onAISearchClick?: () => void
  showAISearchInDev?: boolean // Show AI Search button in dev mode even without config
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onThemeChange, onVersionChange, currentVersion, isDevMode = false, allowUpload = false, onSearchClick = () => {}, onAISearchClick, showAISearchInDev = false }) => {
  const navigate = useNavigate()
  const { updateTrigger } = useConfig()
  const viteMode = import.meta.env.VITE_MODE || 'production'
  const isProductionMode = viteMode === 'production'

  // Get initials for profile fallback
  const getInitials = (name: string | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle sign out
  const handleMobileSignOut = async () => {
    setMobileMenuOpen(false)
    await authService.logout()
    navigate('/auth/login')
  }
  const [logo, setLogo] = useState('')
  const [aiSearchConfig, setAISearchConfig] = useState<AISearchConfig | undefined>(undefined)
  const [_logoLoaded, setLogoLoaded] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [navItems, setNavItems] = useState<Array<{ type: string; label: string; reference: string }>>([])
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [editingReference, setEditingReference] = useState('')
  const [editingType, setEditingType] = useState<'link' | 'button'>('link')
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [hasVersions, setHasVersions] = useState(false)
  const [showLogoEditor, setShowLogoEditor] = useState(false)
  const [colors, setColors] = useState({
    primary: '',
    background: '',
    navbarBackground: '',
    text: '',
    secondaryText: '',
    border: '',
    hoverBg: '',
    buttonBg: '',
    buttonHover: ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userRefreshKey, setUserRefreshKey] = useState(0)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileUser, setMobileUser] = useState<User | null>(null)
  const [mobileProfileImage, setMobileProfileImage] = useState<string | null>(null)

  // Detect mobile/tablet screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check if user is authenticated (only in production mode)
  useEffect(() => {
    // Only check authentication in production mode
    if (!isProductionMode) {
      setIsAuthenticated(false)
      return
    }
    const isAuth = authService.isAuthenticated()
    setIsAuthenticated(isAuth)

    // Load user data for mobile menu
    if (isAuth) {
      const loadUserData = async () => {
        try {
          const userData = await authService.getUser()
          setMobileUser(userData)
          const imageDataUrl = await authService.getProfileImageDataUrl()
          if (imageDataUrl) {
            setMobileProfileImage(imageDataUrl)
          }
        } catch (err) {
          console.error('Failed to load user for mobile menu:', err)
        }
      }
      loadUserData()
    }
  }, [isProductionMode, userRefreshKey])

  // Helper to normalize external URLs
  const normalizeUrl = (url: string): string => {
    if (!url) return '#'
    // If it already has a protocol, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('#')) {
      return url
    }
    // Otherwise, prepend https://
    return `https://${url}`
  }

  useEffect(() => {
    const config = configLoader.getConfig()
    if (config) {
      const newLogo = configLoader.getLogo(theme)
      setLogo(newLogo)
      // Reset logo states when logo path changes
      setLogoLoaded(false)
      setLogoError(false)
      setSiteName(configLoader.getName())
      setNavItems(configLoader.getNavbarItems())
      setVersions(configLoader.getVersions())
      setHasVersions(configLoader.hasVersions())
      setAISearchConfig(configLoader.getAISearchConfig())
      setColors({
        primary: configLoader.getPrimaryColor(theme),
        background: configLoader.getBackgroundColor(theme),
        navbarBackground: configLoader.getNavbarBackgroundColor(theme),
        text: configLoader.getTextColor(theme),
        secondaryText: configLoader.getSecondaryTextColor(theme),
        border: configLoader.getBorderColor(theme),
        hoverBg: configLoader.getHoverBackgroundColor(theme),
        buttonBg: configLoader.getButtonBackgroundColor(theme),
        buttonHover: configLoader.getButtonHoverColor(theme)
      })
    }
  }, [theme, updateTrigger])

  const handleVersionChange = (version: string) => {
    if (onVersionChange) {
      onVersionChange(version)
    }
  }

  const toggleTheme = () => {
    onThemeChange(theme === 'light' ? 'dark' : 'light')
  }

  const handleItemDoubleClick = (index: number, item: { type: string; label: string; reference: string }) => {
    if (isDevMode) {
      // In dev mode, start editing on double click
      setEditingItemIndex(index)
      setEditingLabel(item.label)
      setEditingReference(item.reference)
      setEditingType(item.type as 'link' | 'button')
    }
  }

  const handleAddNewItem = () => {
    // Check if already at maximum (3 items)
    if (navItems.length >= 3) {
      alert('Maximum 3 navbar items allowed')
      return
    }
    setEditingItemIndex(-1) // -1 indicates new item
    setEditingLabel('')
    setEditingReference('')
    setEditingType('link')
  }

  const handleDeleteItem = async (index: number) => {
    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Remove the navbar item
      if (config.navbar) {
        config.navbar.splice(index, 1)
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      const updatedNavItems = [...navItems]
      updatedNavItems.splice(index, 1)
      setNavItems(updatedNavItems)
    } catch (error) {
      console.error('[Navbar] Error deleting navbar item:', error)
    }
  }

  const handleSaveItem = async () => {
    if (editingItemIndex === null) return

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      if (!config.navbar) {
        config.navbar = []
      }

      const newItem = {
        type: editingType,
        label: editingLabel,
        reference: editingReference
      }

      if (editingItemIndex === -1) {
        // Add new item at the beginning (position 0)
        config.navbar.unshift(newItem)
      } else {
        // Update existing item
        if (config.navbar[editingItemIndex]) {
          config.navbar[editingItemIndex] = newItem
        }
      }

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      const updatedNavItems = [...navItems]
      if (editingItemIndex === -1) {
        // Add new item at the beginning to match backend
        updatedNavItems.unshift(newItem)
      } else {
        updatedNavItems[editingItemIndex] = newItem
      }
      setNavItems(updatedNavItems)

      // Close editing
      setEditingItemIndex(null)
      setEditingLabel('')
      setEditingReference('')
      setEditingType('link')
    } catch (error) {
      console.error('[Navbar] Error saving navbar item:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingItemIndex(null)
    setEditingLabel('')
    setEditingReference('')
    setEditingType('link')
  }

  const handleDragStart = (index: number) => {
    if (isDevMode) {
      setDraggedItemIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isDevMode && draggedItemIndex !== null) {
      e.preventDefault()
      if (dragOverIndex !== index) {
        setDragOverIndex(index)
      }
    }
  }

  const handleDragLeave = () => {
    // Small delay to prevent flickering when moving between elements
    setTimeout(() => {
      setDragOverIndex(null)
    }, 50)
  }

  const handleDragEnd = () => {
    setDraggedItemIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (!isDevMode || draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }

    try {
      // Fetch current config
      const config = await configLoader.loadConfig()

      // Reorder items
      const updatedNavItems = [...navItems]
      const [draggedItem] = updatedNavItems.splice(draggedItemIndex, 1)
      updatedNavItems.splice(dropIndex, 0, draggedItem)

      // Update config
      config.navbar = updatedNavItems.map(item => ({
        ...item,
        type: item.type as 'link' | 'button'
      }))

      // Save config
      await ContentService.saveConfig(config)

      // Update config in memory and local state
      configLoader.updateConfig(config)
      setNavItems(updatedNavItems)
      setDraggedItemIndex(null)
      setDragOverIndex(null)
    } catch (error) {
      console.error('[Navbar] Error reordering navbar items:', error)
      setDraggedItemIndex(null)
      setDragOverIndex(null)
    }
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      width: '100%',
      margin: '0',
      padding: '12px 0',
      backgroundColor: colors.navbarBackground,
      borderBottom: `1px solid ${colors.primary}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1550px',
        margin: '0 auto',
        padding: isMobile ? '0 12px' : '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '8px' : '0'
      }}>
      {/* Logo, Site Name, and Version Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <div style={{ display: 'inline-block' }}>
            {logo && !logoError ? (
              <Image
                src={logo}
                alt={siteName}
                style={{ height: isMobile ? '36px' : '32px', width: 'auto', display: 'block' }}
                onLoadSuccess={() => setLogoLoaded(true)}
                onLoadError={() => setLogoError(true)}
              />
            ) : (
              <span style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '600',
                color: colors.text,
                whiteSpace: 'nowrap'
              }}>
                {siteName}
              </span>
            )}
          </div>

          {/* Edit Logo Button - Only in Dev Mode (hide on mobile) */}
          {isDevMode && !isMobile && (
            <button
              onClick={() => setShowLogoEditor(true)}
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
              title="Edit logos"
            >
              <i className="pi pi-pencil"></i>
            </button>
          )}
        </div>

        {/* Version Switcher - show if versions are configured OR in dev mode (hide on mobile) */}
        {(hasVersions || isDevMode) && !isMobile && (
          <VersionSwitcher
            versions={versions}
            currentVersion={currentVersion}
            theme={theme}
            onVersionChange={handleVersionChange}
            isDevMode={isDevMode}
          />
        )}
      </div>

      {/* Search Bar - Hide on mobile, show search icon instead */}
      {!isMobile ? (
        <div style={{
          flex: 1,
          maxWidth: '320px',
          margin: '0 32px',
          position: 'relative'
        }}>
          <i className="pi pi-search" style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            zIndex: 1
          }}></i>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => {
                onSearchClick?.()
            }}
            readOnly
            style={{
              width: '100%',
              padding: '10px 80px 10px 40px',
              backgroundColor: theme === 'light' ? 'rgba(249, 250, 251, 0.8)' : 'rgba(31, 41, 55, 0.8)',
              border: `1px solid ${theme === 'light' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.7)'}`,
              borderRadius: '12px',
              color: colors.text,
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              backdropFilter: 'blur(8px)',
              cursor:  'text'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.7)'
            }}
            onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary
            }}
            onBlur={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(229, 231, 235, 0.7)' : 'rgba(55, 65, 81, 0.7)'
            }}
          />
          <kbd style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '4px 8px',
            backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
            borderRadius: '6px',
            color: colors.secondaryText,
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'monospace',
            lineHeight: '1'
          }}>
            ⌘K
          </kbd>
        </div>
      ) : null}

      {/* Nav Items and Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
        {/* Mobile Search Button */}
        {isMobile && (
          <button
            onClick={onSearchClick}
            style={{
              padding: '8px',
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              fontSize: '16px'
            }}
            title="Search"
          >
            <i className="pi pi-search"></i>
          </button>
        )}

        {/* Add Button - Only in Dev Mode and max 3 items (hide on mobile) */}
        {isDevMode && navItems.length < 3 && !isMobile && (
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
            title="Add navbar item"
          >
            <i className="pi pi-plus"></i>
          </button>
        )}

        {/* AI Search Button (hide on mobile, show in dev mode even without config) */}
        {(aiSearchConfig || showAISearchInDev) && !isMobile && (
          <AISearchButton
            config={aiSearchConfig || { triggerLabel: 'Ask to AI' }}
            theme={theme}
            primaryColor={colors.primary}
            onClick={onAISearchClick}
          />
        )}

        {/* Navbar Items (hide on mobile) */}
        {!isMobile && navItems.map((item, index) => {
          const showLeftIndicator = dragOverIndex === index && draggedItemIndex !== null && draggedItemIndex !== index && draggedItemIndex > index
          const showRightIndicator = dragOverIndex === index && draggedItemIndex !== null && draggedItemIndex !== index && draggedItemIndex < index

          // Drop indicator component - shows on left or right based on drag direction
          const DropIndicator = ({ position }: { position: 'left' | 'right' }) => {
            const shouldShow = position === 'left' ? showLeftIndicator : showRightIndicator
            if (!shouldShow) return null

            return (
              <div style={{
                position: 'absolute',
                [position]: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 20,
              }}>
                {/* Vertical line */}
                <div style={{
                  width: '3px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  borderRadius: '2px',
                  boxShadow: `0 0 8px ${colors.primary}`,
                }} />
              </div>
            )
          }

          if (item.type === 'link') {
            return (
              <div
                key={index}
                draggable={isDevMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  cursor: isDevMode ? 'move' : 'default',
                  opacity: draggedItemIndex === index ? 0.3 : 1,
                }}
                onMouseEnter={() => setHoveredItemIndex(index)}
                onMouseLeave={() => setHoveredItemIndex(null)}
              >
                {/* Drop indicators */}
                <DropIndicator position="left" />
                <DropIndicator position="right" />
                {/* Delete button - Only in Dev Mode */}
                {isDevMode && hoveredItemIndex === index && draggedItemIndex === null && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteItem(index)
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
                    title="Delete navbar item"
                  >
                    <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                  </button>
                )}

                <a
                  href={normalizeUrl(item.reference)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (isDevMode) {
                      e.preventDefault()
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (isDevMode) {
                      e.preventDefault()
                      handleItemDoubleClick(index, item)
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: theme === 'light' ? colors.primary : colors.secondaryText,
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.hoverBg
                    e.currentTarget.style.color = theme === 'light' ? colors.primary : colors.text
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = theme === 'light' ? colors.primary : colors.secondaryText
                  }}
                >
                  {item.label}
                  <i className="pi pi-external-link" style={{ fontSize: '13px' }}></i>
                </a>
              </div>
            )
          } else if (item.type === 'button') {
            // Convertir hex a rgba para sombras
            const hexToRgba = (hex: string, alpha: number) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
              if (result) {
                const r = parseInt(result[1], 16)
                const g = parseInt(result[2], 16)
                const b = parseInt(result[3], 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
              }
              return `rgba(59, 130, 246, ${alpha})`
            }

            return (
              <div
                key={index}
                draggable={isDevMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  cursor: isDevMode ? 'move' : 'default',
                  opacity: draggedItemIndex === index ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={() => setHoveredItemIndex(index)}
                onMouseLeave={() => setHoveredItemIndex(null)}
              >
                {/* Drop indicators */}
                <DropIndicator position="left" />
                <DropIndicator position="right" />
                {/* Delete button - Only in Dev Mode */}
                {isDevMode && hoveredItemIndex === index && draggedItemIndex === null && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteItem(index)
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
                    title="Delete navbar item"
                  >
                    <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                  </button>
                )}

                <a
                  href={normalizeUrl(item.reference)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (isDevMode) {
                      e.preventDefault()
                    }
                  }}
                  onDoubleClick={(e) => {
                    if (isDevMode) {
                      e.preventDefault()
                      handleItemDoubleClick(index, item)
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.buttonHover} 100%)`,
                    color: '#ffffff',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${hexToRgba(colors.primary, 0.2)}`,
                    backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 24px ${hexToRgba(colors.primary, 0.3)}`
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${hexToRgba(colors.primary, 0.2)}`
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {item.label}
                </a>
              </div>
            )
          }
          return null
        })}

        {/* Theme Toggle Button (hide on mobile) */}
        {!isMobile && (
          <button
            onClick={toggleTheme}
            style={{
              padding: '10px',
              backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
              border: '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'light' ? '#4b5563' : '#e5e7eb',
              fontSize: '18px',
              transition: 'border 0.2s',
              marginRight: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = `1px solid ${colors.primary}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent'
            }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <i className={theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'}></i>
          </button>
        )}

        {/* Mobile Menu Button (3 dots) */}
        {isMobile && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: '8px 6px',
                backgroundColor: mobileMenuOpen
                  ? (theme === 'light' ? '#e5e7eb' : '#4b5563')
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme === 'light' ? '#374151' : '#e5e7eb',
                fontSize: '18px'
              }}
              title="Menu"
            >
              <i className="pi pi-ellipsis-v"></i>
            </button>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998
                  }}
                />
                {/* Menu */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  minWidth: '180px',
                  padding: '8px',
                  zIndex: 999
                }}>
                  {/* Navbar items */}
                  {navItems.map((item, index) => (
                    <a
                      key={index}
                      href={normalizeUrl(item.reference)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        color: theme === 'light' ? '#374151' : '#e5e7eb',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <i className="pi pi-external-link" style={{ fontSize: '12px', color: theme === 'light' ? '#9ca3af' : '#6b7280' }}></i>
                      {item.label}
                    </a>
                  ))}

                  {/* Profile section in mobile menu */}
                  {isAuthenticated && mobileUser && (
                    <>
                      <div style={{
                        borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                        marginTop: '8px',
                        paddingTop: '8px'
                      }}>
                        {/* User info row */}
                        <button
                          onClick={() => {
                            setShowProfileModal(true)
                            setMobileMenuOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            color: theme === 'light' ? '#374151' : '#e5e7eb',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {/* Profile photo */}
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {mobileProfileImage ? (
                              <img
                                src={mobileProfileImage}
                                alt={mobileUser.name || 'Profile'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: theme === 'light' ? '#6b7280' : '#d1d5db'
                              }}>
                                {getInitials(mobileUser.name)}
                              </span>
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: theme === 'light' ? '#374151' : '#e5e7eb',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {mobileUser.name || 'User'}
                            </div>
                          </div>
                        </button>

                        {/* Sign Out button */}
                        <button
                          onClick={handleMobileSignOut}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            color: '#ef4444',
                            backgroundColor: 'transparent',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <i className="pi pi-sign-out" style={{ fontSize: '12px' }}></i>
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Menu - Only show when authenticated (hide on mobile) */}
        {isAuthenticated && !isMobile && (
          <ProfileMenu
            theme={theme}
            colors={{
              text: colors.text,
              secondaryText: colors.secondaryText,
              border: colors.border,
              hoverBg: colors.hoverBg,
            }}
            onProfileClick={() => setShowProfileModal(true)}
            refreshKey={userRefreshKey}
          />
        )}
      </div>
      </div>

      {/* Logo Editor Modal */}
      {showLogoEditor && (
        <LogoEditor
          theme={theme}
          allowUpload={allowUpload}
          onClose={() => setShowLogoEditor(false)}
        />
      )}

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        theme={theme}
        primaryColor={colors.primary}
        onUserUpdate={() => setUserRefreshKey(k => k + 1)}
      />

      {/* Navbar Item Editor Modal */}
      {editingItemIndex !== null && (
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
                {editingItemIndex === -1 ? 'Add Navbar Item' : 'Edit Navbar Item'}
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
                Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingType('link')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: editingType === 'link'
                      ? (theme === 'light' ? '#3b82f6' : '#2563eb')
                      : (theme === 'light' ? '#f9fafb' : '#374151'),
                    color: editingType === 'link'
                      ? '#ffffff'
                      : (theme === 'light' ? '#374151' : '#d1d5db'),
                    border: `1px solid ${editingType === 'link' ? '#3b82f6' : (theme === 'light' ? '#d1d5db' : '#4b5563')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  Link
                </button>
                <button
                  onClick={() => setEditingType('button')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: editingType === 'button'
                      ? (theme === 'light' ? '#3b82f6' : '#2563eb')
                      : (theme === 'light' ? '#f9fafb' : '#374151'),
                    color: editingType === 'button'
                      ? '#ffffff'
                      : (theme === 'light' ? '#374151' : '#d1d5db'),
                    border: `1px solid ${editingType === 'button' ? '#3b82f6' : (theme === 'light' ? '#d1d5db' : '#4b5563')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  Button
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                marginBottom: '8px',
              }}>
                Label
              </label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="e.g., Support"
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
                placeholder="e.g., https://example.com"
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
        </div>
      )}

      {/* Floating AI Search Button - Mobile only (show in dev mode even without config) */}
      {isMobile && (aiSearchConfig || showAISearchInDev) && onAISearchClick && (
        <button
          onClick={onAISearchClick}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: colors.primary,
            border: 'none',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 5px 14px rgba(0, 0, 0, 0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.25)'
          }}
        >
          <i className="pi pi-sparkles" style={{ fontSize: '18px', color: '#ffffff' }}></i>
        </button>
      )}
    </nav>
  )
}
