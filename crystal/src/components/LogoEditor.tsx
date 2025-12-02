import { useState, useRef, useEffect } from 'react'
import { configLoader } from '../services/configLoader'
import { ContentService } from '../services/contentService'

interface LogoEditorProps {
  theme: 'light' | 'dark'
  allowUpload?: boolean
  onClose: () => void
}

export const LogoEditor: React.FC<LogoEditorProps> = ({ theme, allowUpload = false, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [lightLogoType, setLightLogoType] = useState<'url' | 'upload'>('url')
  const [darkLogoType, setDarkLogoType] = useState<'url' | 'upload'>('url')
  const [lightLogoUrl, setLightLogoUrl] = useState<string>('')
  const [darkLogoUrl, setDarkLogoUrl] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState<'light' | 'dark' | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const lightFileInputRef = useRef<HTMLInputElement>(null)
  const darkFileInputRef = useRef<HTMLInputElement>(null)

  // Load current logos on mount
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const data = await configLoader.loadConfig()

        // Always set values, even if empty
        const lightLogo = data.logo?.light || ''
        const darkLogo = data.logo?.dark || ''

        setLightLogoUrl(lightLogo)
        setLightLogoType(lightLogo.startsWith('http') ? 'url' : 'upload')

        setDarkLogoUrl(darkLogo)
        setDarkLogoType(darkLogo.startsWith('http') ? 'url' : 'upload')

      } catch (error) {
        console.error('[LogoEditor] Error loading logos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadLogos()
  }, [])

  const handleFileUpload = async (file: File, mode: 'light' | 'dark') => {
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file')
      setTimeout(() => setSaveError(null), 3000)
      return
    }

    setIsUploading(mode)

    try {
      const reader = new FileReader()
      reader.onload = async (_event) => {

        try {
          const data = await ContentService.uploadFile(file)
          const uploadedPath = `/${data.file_path}`


          // Wait a bit for the file to be written to disk
          await new Promise(resolve => setTimeout(resolve, 2000))

          // Update with server path after successful upload
          if (mode === 'light') {
            setLightLogoUrl(uploadedPath)
          } else {
            setDarkLogoUrl(uploadedPath)
          }

          setIsUploading(null)
        } catch (err) {
          console.error('[LogoEditor] Upload error:', err)
          setSaveError(`Failed to upload ${mode} logo`)
          setTimeout(() => setSaveError(null), 3000)
          setIsUploading(null)
        }
      }

      reader.onerror = () => {
        setSaveError('Failed to read file')
        setTimeout(() => setSaveError(null), 3000)
        setIsUploading(null)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('[LogoEditor] File read error:', err)
      setSaveError('Failed to process file')
      setTimeout(() => setSaveError(null), 3000)
      setIsUploading(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Read the current full config
      const currentFullConfig = await configLoader.loadConfig()

      // Update logo config
      const updatedConfig = {
        ...currentFullConfig,
        logo: {
          light: lightLogoUrl || currentFullConfig.logo?.light || '',
          dark: darkLogoUrl || currentFullConfig.logo?.dark || ''
        }
      }

      await ContentService.saveConfig(updatedConfig)

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)

      // Wait a bit for the file to be written to disk, then reload config from server
      setTimeout(async () => {
        await configLoader.reloadConfig()
        // Close the modal after config is reloaded
        onClose()
      }, 500)
    } catch (error) {
      console.error('Error saving logos:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save logos')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setIsSaving(false)
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

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '12px',
          padding: '32px',
          minWidth: '600px',
          maxWidth: '700px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxHeight: '85vh',
          overflowY: 'auto',
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
              fontSize: '24px',
              fontWeight: '600',
              color: theme === 'light' ? '#111827' : '#f9fafb',
            }}
          >
            Edit Logos
          </h2>
          <button
            onClick={onClose}
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

        {/* Loading state */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 0',
            color: theme === 'light' ? '#6b7280' : '#9ca3af'
          }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          </div>
        ) : (
          <>
        {/* Light Mode Logo */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme === 'light' ? '#111827' : '#f9fafb',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="pi pi-sun" style={{ fontSize: '18px', color: '#fbbf24' }}></i>
            Light Mode Logo
          </h3>

          {/* Type Selection - Hidden in production */}
          {allowUpload && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setLightLogoType('url')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: lightLogoType === 'url' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: lightLogoType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
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
                onClick={() => setLightLogoType('upload')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: lightLogoType === 'upload' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: lightLogoType === 'upload' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
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
          {(!allowUpload || lightLogoType === 'url') ? (
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input
                type="text"
                value={lightLogoUrl || ''}
                onChange={(e) => {
                  setLightLogoUrl(e.target.value)
                }}
                placeholder="https://example.com/logo-light.svg"
                style={inputStyle}
              />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Upload Logo</label>
              <input
                ref={lightFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'light')
                }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => lightFileInputRef.current?.click()}
                disabled={isUploading === 'light'}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `2px dashed ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                  borderRadius: '6px',
                  cursor: isUploading === 'light' ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isUploading === 'light' ? (
                  <>
                    <i className="pi pi-spin pi-spinner"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload"></i>
                    Choose File
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview - Outside of type conditional */}
        {lightLogoUrl && (
          <div style={{ marginTop: '12px' }}>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Preview:</label>
            <div style={{
              padding: '16px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100px'
            }}>
              <img
                src={lightLogoUrl}
                alt="Light logo preview"
                style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  console.error('[LogoEditor] Failed to load light logo:', lightLogoUrl)
                  const img = e.target as HTMLImageElement
                  img.style.display = 'none'
                  const parent = img.parentElement
                  if (parent && !parent.querySelector('.error-message')) {
                    const errorMsg = document.createElement('span')
                    errorMsg.className = 'error-message'
                    errorMsg.textContent = 'Failed to load image'
                    errorMsg.style.color = theme === 'light' ? '#991b1b' : '#fca5a5'
                    errorMsg.style.fontSize = '13px'
                    parent.appendChild(errorMsg)
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Dark Mode Logo */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme === 'light' ? '#111827' : '#f9fafb',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="pi pi-moon" style={{ fontSize: '18px', color: '#818cf8' }}></i>
            Dark Mode Logo
          </h3>

          {/* Type Selection - Hidden in production */}
          {allowUpload && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setDarkLogoType('url')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: darkLogoType === 'url' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: darkLogoType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
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
                onClick={() => setDarkLogoType('upload')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: darkLogoType === 'upload' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                  color: darkLogoType === 'upload' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
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
          {(!allowUpload || darkLogoType === 'url') ? (
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input
                type="text"
                value={darkLogoUrl || ''}
                onChange={(e) => {
                  setDarkLogoUrl(e.target.value)
                }}
                placeholder="https://example.com/logo-dark.svg"
                style={inputStyle}
              />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Upload Logo</label>
              <input
                ref={darkFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, 'dark')
                }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => darkFileInputRef.current?.click()}
                disabled={isUploading === 'dark'}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `2px dashed ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                  borderRadius: '6px',
                  cursor: isUploading === 'dark' ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isUploading === 'dark' ? (
                  <>
                    <i className="pi pi-spin pi-spinner"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload"></i>
                    Choose File
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview - Outside of type conditional */}
          {darkLogoUrl && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Preview:</label>
              <div style={{
                padding: '16px',
                backgroundColor: theme === 'light' ? '#111827' : '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px'
              }}>
                <img
                  src={darkLogoUrl}
                  alt="Dark logo preview"
                  style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('[LogoEditor] Failed to load dark logo:', darkLogoUrl)
                    const img = e.target as HTMLImageElement
                    img.style.display = 'none'
                    const parent = img.parentElement
                    if (parent && !parent.querySelector('.error-message')) {
                      const errorMsg = document.createElement('span')
                      errorMsg.className = 'error-message'
                      errorMsg.textContent = 'Failed to load image'
                      errorMsg.style.color = theme === 'light' ? '#991b1b' : '#fca5a5'
                      errorMsg.style.fontSize = '13px'
                      parent.appendChild(errorMsg)
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: theme === 'light' ? '#d1fae5' : '#064e3b',
            color: theme === 'light' ? '#065f46' : '#6ee7b7',
            borderRadius: '6px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="pi pi-check-circle"></i>
            Logos saved successfully! Reloading...
          </div>
        )}

        {saveError && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
            color: theme === 'light' ? '#991b1b' : '#fca5a5',
            borderRadius: '6px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="pi pi-times-circle"></i>
            {saveError}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
              color: theme === 'light' ? '#374151' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading !== null}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: isSaving || isUploading !== null ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving || isUploading !== null ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSaving ? (
              <>
                <i className="pi pi-spin pi-spinner"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="pi pi-save"></i>
                Save Logos
              </>
            )}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
