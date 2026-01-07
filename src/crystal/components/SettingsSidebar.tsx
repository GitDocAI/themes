import { useState, useEffect, useRef, useCallback } from 'react'
import { configLoader } from '../../services/configLoader'
import { useConfig } from '../hooks/useConfig'
import { Image } from './ui/Image'
import { ContentService } from '../../services/contentService'

const SIDEBAR_WIDTH_KEY = 'settings_sidebar_width'
const MIN_WIDTH = 350
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 450

interface SettingsSidebarProps {
  theme: 'light' | 'dark'
  isDevMode: boolean
  onDevModeToggle: () => void
  isOpen: boolean
  onToggle: () => void
  allowUpload?: boolean
  buttonVisible?: boolean
}

interface GlobalConfig {
  name?: string
  colors?: {
    light?: string
    dark?: string
  }
  defaultThemeMode?: 'light' | 'dark'
  favicon?: string
  banner?: {
    message?: string
    colors?: {
      light?: string
      dark?: string
    }
  }
  background?: {
    colors?: {
      light?: string
      dark?: string
    }
  }
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  theme,
  isDevMode,
  onDevModeToggle,
  isOpen,
  onToggle,
  allowUpload = false,
  buttonVisible = true
}) => {
  const { updateTrigger } = useConfig()
  const [config, setConfig] = useState<GlobalConfig>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [faviconType, setFaviconType] = useState<'url' | 'upload'>('url')
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return

    const newWidth = window.innerWidth - e.clientX
    const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))
    setSidebarWidth(clampedWidth)
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false)
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString())
    }
  }, [isResizing, sidebarWidth])

  // Add/remove mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Load current config on mount and when config changes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsInitialLoad(true)
        const data = await configLoader.loadConfig()

        // Detect favicon type
        const favicon = data.favicon || ''
        setFaviconType(favicon.startsWith('http') ? 'url' : 'upload')

        setConfig({
          name: data.name || '',
          colors: data.colors || { light: '', dark: '' },
          defaultThemeMode: data.defaultThemeMode || 'light',
          favicon: favicon,
          background: data.background || { colors: { light: '', dark: '' } }
        })

        // Allow auto-save after initial load completes
        setTimeout(() => setIsInitialLoad(false), 100)
      } catch (error) {
        console.error('Error loading config:', error)
        setIsInitialLoad(false)
      }
    }
    loadConfig()
  }, [updateTrigger])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Read the current full config to merge with our changes
      const currentFullConfig = await configLoader.loadConfig()

      // Merge only the fields we're managing, keeping others intact (banner is managed by Banner.tsx)
      const updatedConfig = {
        ...currentFullConfig,
        ...(config.name && { name: config.name }),
        ...(config.colors && { colors: config.colors }),
        ...(config.defaultThemeMode && { defaultThemeMode: config.defaultThemeMode }),
        ...(config.favicon && { favicon: config.favicon }),
        ...(config.background && { background: config.background })
      }

      await ContentService.saveConfig(updatedConfig)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

      // Wait a bit for the file to be written to disk, then reload config from server
      setTimeout(async () => {
        await configLoader.reloadConfig()
      }, 500)
    } catch (error) {
      console.error('Error saving config:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save with debounce when config changes
  useEffect(() => {
    // Don't auto-save on initial load
    if (isInitialLoad) return

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [config])

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file')
      setTimeout(() => setSaveError(null), 3000)
      return
    }

    setFaviconUploading(true)

    try {
      const result = await ContentService.uploadFile(file)
      setConfig(prev => ({ ...prev, favicon: `${result.file_path}` }))
      console.log(result)
      setFaviconUploading(false)
    } catch (err) {
      console.error('File read error:', err)
      setSaveError('Failed to process file')
      setTimeout(() => setSaveError(null), 3000)
      setFaviconUploading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: theme === 'light' ? '#f9fafb' : '#374151',
    border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
    borderRadius: '6px',
    color: theme === 'light' ? '#374151' : '#e5e7eb',
    fontSize: '14px',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500' as const,
    color: theme === 'light' ? '#374151' : '#d1d5db',
    marginBottom: '6px',
  }

  const sectionStyle = {
    marginBottom: '20px',
  }

  return (
    <>
      {/* Floating Settings Button */}
      {buttonVisible && (
      <button
        onClick={onToggle}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: isOpen
            ? (theme === 'light' ? '#6b7280' : '#9ca3af')
            : (theme === 'light'
              ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.9) 0%, rgba(75, 85, 99, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(156, 163, 175, 0.9) 0%, rgba(107, 114, 128, 0.9) 100%)'),
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme === 'light'
            ? '0 4px 12px rgba(107, 114, 128, 0.4)'
            : '0 4px 12px rgba(156, 163, 175, 0.3)',
          zIndex: 9999,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = theme === 'light'
            ? '0 8px 20px rgba(107, 114, 128, 0.5)'
            : '0 8px 20px rgba(156, 163, 175, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = theme === 'light'
            ? '0 4px 12px rgba(107, 114, 128, 0.4)'
            : '0 4px 12px rgba(156, 163, 175, 0.3)'
        }}
        title="Settings"
      >
        <i
          className={isOpen ? "pi pi-times" : "pi pi-cog"}
          style={{
            fontSize: isOpen ? '16px' : '18px',
            animation: isOpen ? 'none' : 'spin 4s linear infinite'
          }}
        ></i>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
      )}

      {/* Overlay/Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9997,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Settings Sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : `-${sidebarWidth}px`,
          width: `${sidebarWidth}px`,
          height: '100vh',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderLeft: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: isOpen ? '-4px 0 12px rgba(0,0,0,0.1)' : 'none',
          transition: isResizing ? 'none' : 'right 0.3s ease',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '6px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: isResizing ? (theme === 'light' ? '#3b82f6' : '#8b5cf6') : 'transparent',
            transition: 'background-color 0.2s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(139, 92, 246, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        />
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: theme === 'light' ? '#111827' : '#f9fafb'
          }}>
            Settings
          </h2>
          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              fontSize: '24px',
              padding: '4px'
            }}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Dev/Preview Mode Toggle */}
          <div style={sectionStyle}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#6366f1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: theme === 'light' ? '#111827' : '#f9fafb'
                  }}
                >
                  {isDevMode ? 'Dev Mode' : 'Preview Mode'}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: theme === 'light' ? '#6b7280' : '#9ca3af'
                  }}
                >
                  {isDevMode ? 'Edit and modify content' : 'View content only'}
                </span>
              </div>

              {/* Toggle Switch */}
              <div
                onClick={(e) => {
                  e.preventDefault()
                  onDevModeToggle()
                }}
                style={{
                  width: '48px',
                  height: '28px',
                  backgroundColor: isDevMode ? '#3b82f6' : (theme === 'light' ? '#d1d5db' : '#4b5563'),
                  borderRadius: '14px',
                  position: 'relative',
                  transition: 'background-color 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: isDevMode ? '23px' : '3px',
                    width: '22px',
                    height: '22px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </div>
            </label>
          </div>

          {/* Only show global configuration in dev mode */}
          {isDevMode && (
            <>
              {/* Section Card Style */}
              {(() => {
                const cardStyle = {
                  backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px'
                }
                const sectionHeaderStyle = {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`
                }
                const sectionTitleStyle = {
                  fontSize: '14px',
                  fontWeight: '600' as const,
                  color: theme === 'light' ? '#374151' : '#e5e7eb',
                  margin: 0
                }
                const iconStyle = {
                  fontSize: '14px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af'
                }
                return (
                  <>
                    {/* Colors Section */}
                    <div style={cardStyle}>
                      <div style={sectionHeaderStyle}>
                        <i className="pi pi-palette" style={iconStyle}></i>
                        <h4 style={sectionTitleStyle}>Colors</h4>
                      </div>

                      {/* Primary Colors */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Primary Colors</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Light Mode</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={config.colors?.light || '#3b82f6'}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  colors: { ...prev.colors, light: e.target.value }
                                }))}
                                style={{
                                  width: '50px',
                                  height: '38px',
                                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              />
                              <input
                                type="text"
                                value={config.colors?.light || ''}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  colors: { ...prev.colors, light: e.target.value }
                                }))}
                                placeholder="#3b82f6"
                                style={{ ...inputStyle, flex: 1 }}
                              />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Dark Mode</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={config.colors?.dark || '#8b5cf6'}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  colors: { ...prev.colors, dark: e.target.value }
                                }))}
                                style={{
                                  width: '50px',
                                  height: '38px',
                                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              />
                              <input
                                type="text"
                                value={config.colors?.dark || ''}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  colors: { ...prev.colors, dark: e.target.value }
                                }))}
                                placeholder="#8b5cf6"
                                style={{ ...inputStyle, flex: 1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Background Colors */}
                      <div>
                        <label style={labelStyle}>Background Colors</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Light Mode</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={config.background?.colors?.light || '#fafbfc'}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  background: {
                                    ...prev.background,
                                    colors: { ...prev.background?.colors, light: e.target.value }
                                  }
                                }))}
                                style={{
                                  width: '50px',
                                  height: '38px',
                                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              />
                              <input
                                type="text"
                                value={config.background?.colors?.light || ''}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  background: {
                                    ...prev.background,
                                    colors: { ...prev.background?.colors, light: e.target.value }
                                  }
                                }))}
                                placeholder="#fafbfc"
                                style={{ ...inputStyle, flex: 1 }}
                              />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Dark Mode</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="color"
                                value={config.background?.colors?.dark || '#0a0f1c'}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  background: {
                                    ...prev.background,
                                    colors: { ...prev.background?.colors, dark: e.target.value }
                                  }
                                }))}
                                style={{
                                  width: '50px',
                                  height: '38px',
                                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              />
                              <input
                                type="text"
                                value={config.background?.colors?.dark || ''}
                                onChange={(e) => setConfig(prev => ({
                                  ...prev,
                                  background: {
                                    ...prev.background,
                                    colors: { ...prev.background?.colors, dark: e.target.value }
                                  }
                                }))}
                                placeholder="#0a0f1c"
                                style={{ ...inputStyle, flex: 1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Theme Section */}
                    <div style={cardStyle}>
                      <div style={sectionHeaderStyle}>
                        <i className="pi pi-sun" style={iconStyle}></i>
                        <h4 style={sectionTitleStyle}>Default Theme</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setConfig(prev => ({ ...prev, defaultThemeMode: 'light' }))}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: config.defaultThemeMode === 'light' ? '#3b82f6' : theme === 'light' ? '#ffffff' : '#374151',
                            color: config.defaultThemeMode === 'light' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                            border: `1px solid ${config.defaultThemeMode === 'light' ? '#3b82f6' : theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                          }}
                        >
                          <i className="pi pi-sun" style={{ marginRight: '6px' }}></i>
                          Light
                        </button>
                        <button
                          onClick={() => setConfig(prev => ({ ...prev, defaultThemeMode: 'dark' }))}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: config.defaultThemeMode === 'dark' ? '#3b82f6' : theme === 'light' ? '#ffffff' : '#374151',
                            color: config.defaultThemeMode === 'dark' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                            border: `1px solid ${config.defaultThemeMode === 'dark' ? '#3b82f6' : theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                          }}
                        >
                          <i className="pi pi-moon" style={{ marginRight: '6px' }}></i>
                          Dark
                        </button>
                      </div>
                    </div>

                    {/* Branding Section */}
                    <div style={cardStyle}>
                      <div style={sectionHeaderStyle}>
                        <i className="pi pi-image" style={iconStyle}></i>
                        <h4 style={sectionTitleStyle}>Favicon</h4>
                      </div>

                      {/* Type Selection - Hidden in production */}
                      {allowUpload && (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <button
                            onClick={() => setFaviconType('url')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: faviconType === 'url' ? '#3b82f6' : theme === 'light' ? '#ffffff' : '#374151',
                              color: faviconType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                              border: `1px solid ${faviconType === 'url' ? '#3b82f6' : theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                            }}
                          >
                            <i className="pi pi-link" style={{ marginRight: '6px' }}></i>
                            URL
                          </button>
                          <button
                            onClick={() => setFaviconType('upload')}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: faviconType === 'upload' ? '#3b82f6' : theme === 'light' ? '#ffffff' : '#374151',
                              color: faviconType === 'upload' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                              border: `1px solid ${faviconType === 'upload' ? '#3b82f6' : theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                            }}
                          >
                            <i className="pi pi-upload" style={{ marginRight: '6px' }}></i>
                            Upload
                          </button>
                        </div>
                      )}

                      {/* URL Input or File Upload */}
                      {(!allowUpload || faviconType === 'url') ? (
                        <input
                          type="text"
                          value={config.favicon || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, favicon: e.target.value }))}
                          placeholder="https://example.com/favicon.ico"
                          style={inputStyle}
                        />
                      ) : (
                        <>
                          <input
                            ref={faviconInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFaviconUpload}
                            style={{ display: 'none' }}
                          />

                         <div className='w-full flex justify-center items-center min-h-16'>
                          <Image src={config.favicon||''} className='w-10 h-10  object-cover ml-auto'/>
                         </div>

                          <button
                            onClick={() => faviconInputRef.current?.click()}
                            disabled={faviconUploading}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                              color: theme === 'light' ? '#374151' : '#d1d5db',
                              border: `2px dashed ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                              borderRadius: '6px',
                              cursor: faviconUploading ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            {faviconUploading ? (
                              <>
                                <i className="pi pi-spin pi-spinner"></i>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <i className="pi pi-upload"></i>
                                {config.favicon ? 'Change Favicon' : 'Choose File'}
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {config.favicon && (
                        <p style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          color: theme === 'light' ? '#10b981' : '#34d399',
                        }}>
                          <i className="pi pi-check-circle" style={{ marginRight: '4px' }}></i>
                          {config.favicon}
                        </p>
                      )}
                    </div>
                  </>
                )
              })()}

          {/* Auto-save Status */}
          {isSaving && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: theme === 'light' ? '#e0f2fe' : '#0c4a6e',
              color: theme === 'light' ? '#0369a1' : '#7dd3fc',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="pi pi-spin pi-spinner"></i>
              Saving...
            </div>
          )}

          {saveSuccess && !isSaving && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: theme === 'light' ? '#d1fae5' : '#064e3b',
              color: theme === 'light' ? '#065f46' : '#6ee7b7',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="pi pi-check-circle"></i>
              Saved
            </div>
          )}

          {saveError && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
              color: theme === 'light' ? '#991b1b' : '#fca5a5',
              borderRadius: '6px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="pi pi-times-circle"></i>
              {saveError}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
