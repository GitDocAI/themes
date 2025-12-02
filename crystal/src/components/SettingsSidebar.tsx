import { useState, useEffect, useRef } from 'react'
import { configLoader } from '../services/configLoader'
import { useConfig } from '../hooks/useConfig'
import { ContentService } from '../services/contentService'

interface SettingsSidebarProps {
  theme: 'light' | 'dark'
  isDevMode: boolean
  onDevModeToggle: () => void
  isOpen: boolean
  onToggle: () => void
  allowUpload?: boolean
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
  allowUpload = false
}) => {
  const { updateTrigger } = useConfig()
  const [config, setConfig] = useState<GlobalConfig>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [faviconType, setFaviconType] = useState<'url' | 'upload'>('url')
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [bannerEnabled, setBannerEnabled] = useState(false)

  // Load current config on mount and when config changes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await configLoader.loadConfig()
        const hasBanner = !!data.banner
        setBannerEnabled(hasBanner)

        // Detect favicon type
        const favicon = data.favicon || ''
        setFaviconType(favicon.startsWith('http') ? 'url' : 'upload')

        setConfig({
          name: data.name || '',
          colors: data.colors || { light: '', dark: '' },
          defaultThemeMode: data.defaultThemeMode || 'light',
          favicon: favicon,
          banner: data.banner || undefined,
          background: data.background || { colors: { light: '', dark: '' } }
        })
      } catch (error) {
        console.error('Error loading config:', error)
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

      // Merge only the fields we're managing, keeping others intact
      const updatedConfig = {
        ...currentFullConfig,
        ...(config.name && { name: config.name }),
        ...(config.colors && { colors: config.colors }),
        ...(config.defaultThemeMode && { defaultThemeMode: config.defaultThemeMode }),
        ...(config.favicon && { favicon: config.favicon }),
        ...(config.background && { background: config.background })
      }

      // Handle banner - if enabled, add it; if disabled, remove it completely
      if (bannerEnabled && config.banner) {
        updatedConfig.banner = {
          message: config.banner.message || '',
          colors: {
            light: config.banner.colors?.light || '',
            dark: config.banner.colors?.dark || ''
          }
        }
      } else if (!bannerEnabled) {
        delete updatedConfig.banner
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
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string
        const base64String = base64Data.split(',')[1]

        const timestamp = Date.now()
        const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `assets/${filename}`


        try {
          await ContentService.saveContent(filePath,base64String)
          setConfig(prev => ({ ...prev, favicon: `docs/content/assests/${filePath}` }))
          setFaviconUploading(false)
        } catch (err) {
          console.error('Upload error:', err)
          setSaveError('Failed to upload favicon')
          setTimeout(() => setSaveError(null), 3000)
          setFaviconUploading(false)
        }
      }

      reader.onerror = () => {
        setSaveError('Failed to read file')
        setTimeout(() => setSaveError(null), 3000)
        setFaviconUploading(false)
      }

      reader.readAsDataURL(file)
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
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
          fontSize: '24px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Settings"
      >
        <i
          className="pi pi-cog"
          style={{
            animation: 'spin 3s linear infinite'
          }}
        ></i>
        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </button>

      {/* Settings Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : '-450px',
          width: '450px',
          height: '100vh',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderLeft: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          boxShadow: isOpen ? '-4px 0 12px rgba(0,0,0,0.1)' : 'none',
          transition: 'right 0.3s ease',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
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
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme === 'light' ? '#111827' : '#f9fafb',
                marginBottom: '16px',
                marginTop: '24px'
              }}>
                Global Configuration
              </h3>

              {/* Name */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Project Name</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Documentation"
              style={inputStyle}
            />
          </div>

          {/* Primary Colors */}
          <div style={sectionStyle}>
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

          {/* Default Theme Mode */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Default Theme Mode</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setConfig(prev => ({ ...prev, defaultThemeMode: 'light' }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: config.defaultThemeMode === 'light' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: config.defaultThemeMode === 'light' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                  border: 'none',
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
                  backgroundColor: config.defaultThemeMode === 'dark' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: config.defaultThemeMode === 'dark' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                  border: 'none',
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

          {/* Favicon */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Favicon</label>

            {/* Type Selection - Hidden in production */}
            {allowUpload && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  onClick={() => setFaviconType('url')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: faviconType === 'url' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                    color: faviconType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                    border: 'none',
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
                    backgroundColor: faviconType === 'upload' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                    color: faviconType === 'upload' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                    border: 'none',
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
                <button
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={faviconUploading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                    color: theme === 'light' ? '#374151' : '#d1d5db',
                    border: `2px dashed ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
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

          {/* Banner */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Banner</label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={bannerEnabled}
                  onChange={(e) => {
                    const isChecked = e.target.checked
                    setBannerEnabled(isChecked)
                    if (isChecked) {
                      setConfig(prev => ({
                        ...prev,
                        banner: {
                          message: '',
                          colors: { light: '#3b82f6', dark: '#8b5cf6' }
                        }
                      }))
                    } else {
                      setConfig(prev => {
                        const newConfig = { ...prev }
                        delete newConfig.banner
                        return newConfig
                      })
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '12px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                  Enable
                </span>
              </label>
            </div>
            {bannerEnabled && config.banner && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Message</label>
                  <input
                    type="text"
                    value={config.banner.message || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      banner: { ...prev.banner!, message: e.target.value }
                    }))}
                    placeholder="Welcome message..."
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Light Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={config.banner.colors?.light || '#3b82f6'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          banner: {
                            ...prev.banner!,
                            colors: { ...prev.banner?.colors, light: e.target.value }
                          }
                        }))}
                        style={{
                          width: '40px',
                          height: '32px',
                          border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={config.banner.colors?.light || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          banner: {
                            ...prev.banner!,
                            colors: { ...prev.banner?.colors, light: e.target.value }
                          }
                        }))}
                        placeholder="#3b82f6"
                        style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, fontSize: '12px', marginBottom: '4px' }}>Dark Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={config.banner.colors?.dark || '#8b5cf6'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          banner: {
                            ...prev.banner!,
                            colors: { ...prev.banner?.colors, dark: e.target.value }
                          }
                        }))}
                        style={{
                          width: '40px',
                          height: '32px',
                          border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={config.banner.colors?.dark || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          banner: {
                            ...prev.banner!,
                            colors: { ...prev.banner?.colors, dark: e.target.value }
                          }
                        }))}
                        placeholder="#8b5cf6"
                        style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Background Colors */}
          <div style={sectionStyle}>
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSaving ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
          >
            {isSaving ? (
              <>
                <i className="pi pi-spin pi-spinner" style={{ marginRight: '8px' }}></i>
                Saving...
              </>
            ) : (
              <>
                <i className="pi pi-save" style={{ marginRight: '8px' }}></i>
                Save Configuration
              </>
            )}
          </button>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div style={{
              marginTop: '12px',
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
              Configuration saved successfully! Reloading...
            </div>
          )}

          {saveError && (
            <div style={{
              marginTop: '12px',
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
