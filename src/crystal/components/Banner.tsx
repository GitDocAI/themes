import { useState, useEffect, useRef } from 'react'
import { configLoader } from '../../services/configLoader'
import { ContentService } from '../../services/contentService'
import { useConfig } from '../hooks/useConfig'

interface BannerProps {
  theme: 'light' | 'dark'
  isDevMode?: boolean
}

export const Banner: React.FC<BannerProps> = ({ theme, isDevMode = false }) => {
  const { updateTrigger } = useConfig()
  const [visible, setVisible] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [lightColor, setLightColor] = useState('#3b82f6')
  const [darkColor, setDarkColor] = useState('#8b5cf6')
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Load banner config
  useEffect(() => {
    const loadConfig = () => {
      setIsInitialLoad(true)
      const config = configLoader.getConfig()
      const hasBanner = !!config?.banner?.message
      setEnabled(hasBanner)
      setMessage(config?.banner?.message || '')
      setLightColor(config?.banner?.colors?.light || '#3b82f6')
      setDarkColor(config?.banner?.colors?.dark || '#8b5cf6')
      setTimeout(() => setIsInitialLoad(false), 100)
    }
    loadConfig()
  }, [updateTrigger])

  // Focus message input when editing starts
  useEffect(() => {
    if (isEditingMessage && messageInputRef.current) {
      messageInputRef.current.focus()
      const length = messageInputRef.current.value.length
      messageInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditingMessage])

  // Auto-save with debounce
  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const currentConfig = await configLoader.loadConfig()

      if (enabled) {
        currentConfig.banner = {
          message: message,
          colors: {
            light: lightColor,
            dark: darkColor
          }
        }
      } else {
        delete currentConfig.banner
      }

      await ContentService.saveConfig(currentConfig)

      setTimeout(async () => {
        await configLoader.reloadConfig()
      }, 300)
    } catch (error) {
      console.error('Error saving banner config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Debounced save
  useEffect(() => {
    if (isInitialLoad) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveConfig()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [enabled, message, lightColor, darkColor])

  // Helper to convert hex to rgba
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

  const bannerColor = theme === 'light' ? lightColor : darkColor

  // In production mode, don't render if not enabled or no message
  if (!isDevMode && (!enabled || !message || !visible)) return null

  // In dev mode, always render but show disabled state
  const isDisabledState = isDevMode && !enabled

  return (
    <div
      style={{
        width: '100%',
        margin: '0',
        padding: '12px 16px',
        backgroundColor: isDisabledState
          ? (theme === 'light' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(75, 85, 99, 0.2)')
          : hexToRgba(bannerColor, 0.1),
        borderBottom: `1px solid ${isDisabledState
          ? (theme === 'light' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(75, 85, 99, 0.3)')
          : hexToRgba(bannerColor, 0.2)}`,
        color: isDisabledState
          ? (theme === 'light' ? '#9ca3af' : '#6b7280')
          : bannerColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        fontSize: '14px',
        fontWeight: '500',
        boxSizing: 'border-box',
        opacity: isDisabledState ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Color Pickers - Left side (Dev mode only) */}
      {isDevMode && (
        <div
          style={{
            position: 'absolute',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Light mode color picker */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: enabled ? 'pointer' : 'not-allowed',
              opacity: enabled ? 1 : 0.5
            }}
            title="Light mode color"
          >
            <i className="pi pi-sun" style={{ fontSize: '14px', color: theme === 'light' ? '#f59e0b' : '#fbbf24' }}></i>
            <input
              type="color"
              value={lightColor}
              onChange={(e) => setLightColor(e.target.value)}
              disabled={!enabled}
              style={{
                width: '24px',
                height: '24px',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '4px',
                cursor: enabled ? 'pointer' : 'not-allowed',
                padding: 0,
                backgroundColor: 'transparent'
              }}
            />
          </label>

          {/* Dark mode color picker */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: enabled ? 'pointer' : 'not-allowed',
              opacity: enabled ? 1 : 0.5
            }}
            title="Dark mode color"
          >
            <i className="pi pi-moon" style={{ fontSize: '14px', color: theme === 'light' ? '#6366f1' : '#818cf8' }}></i>
            <input
              type="color"
              value={darkColor}
              onChange={(e) => setDarkColor(e.target.value)}
              disabled={!enabled}
              style={{
                width: '24px',
                height: '24px',
                border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                borderRadius: '4px',
                cursor: enabled ? 'pointer' : 'not-allowed',
                padding: 0,
                backgroundColor: 'transparent'
              }}
            />
          </label>

          {/* Saving indicator */}
          {isSaving && (
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '12px', marginLeft: '4px' }}></i>
          )}
        </div>
      )}

      {/* Banner content */}
      <i className="pi pi-info-circle" style={{ fontSize: '16px' }}></i>

      {/* Message - editable in dev mode when enabled */}
      {isDevMode && enabled ? (
        isEditingMessage ? (
          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => setIsEditingMessage(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingMessage(false)
              } else if (e.key === 'Escape') {
                setIsEditingMessage(false)
              }
            }}
            placeholder="Enter banner message..."
            size={Math.max(20, message.length + 2)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${bannerColor}`,
              color: bannerColor,
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center',
              outline: 'none',
              width: `${Math.max(200, (message.length + 2) * 8)}px`,
              maxWidth: 'calc(100vw - 300px)',
              padding: '2px 4px'
            }}
          />
        ) : (
          <span
            onClick={() => setIsEditingMessage(true)}
            style={{
              cursor: 'text',
              padding: '2px 4px',
              borderBottom: '2px solid transparent',
              transition: 'border-color 0.15s',
              minWidth: '100px',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderBottomColor = hexToRgba(bannerColor, 0.3)
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
            title="Click to edit message"
          >
            {message || 'Click to add message...'}
          </span>
        )
      ) : isDevMode && !enabled ? (
        <span style={{ fontStyle: 'italic' }}>Banner disabled</span>
      ) : (
        <span>{message}</span>
      )}

      {/* Right side controls */}
      <div style={{ position: 'absolute', right: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Enable/Disable Toggle (Dev mode only) */}
        {isDevMode && (
          <div
            onClick={() => {
              const newEnabled = !enabled
              if (newEnabled && !message) {
                // Set a default message when enabling with no message
                setMessage('Click to edit this banner message...')
              }
              setEnabled(newEnabled)
            }}
            style={{
              width: '40px',
              height: '22px',
              backgroundColor: enabled ? '#10b981' : (theme === 'light' ? '#d1d5db' : '#4b5563'),
              borderRadius: '11px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            title={enabled ? 'Disable banner' : 'Enable banner'}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: enabled ? '20px' : '2px',
                width: '18px',
                height: '18px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        )}

        {/* Close button (Production mode only) */}
        {!isDevMode && (
          <button
            onClick={() => setVisible(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: bannerColor,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'opacity 0.2s',
              opacity: 0.7
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            aria-label="Close banner"
          >
            <i className="pi pi-times" style={{ fontSize: '14px' }}></i>
          </button>
        )}
      </div>
    </div>
  )
}
