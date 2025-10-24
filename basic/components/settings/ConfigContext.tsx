'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeInfo } from '@/models/ThemeInfo'

interface ConfigContextType {
  config: ThemeInfo
  isConfigOpen: boolean
  isSaving: boolean
  toggleConfig: () => void
  updateConfig: (updates: Partial<ThemeInfo>) => void
  saveConfig: () => Promise<void>
  resetConfig: () => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

interface ConfigProviderProps {
  children: ReactNode
  initialConfig: ThemeInfo
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children, initialConfig }) => {
  const [config, setConfig] = useState<ThemeInfo>(initialConfig)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const toggleConfig = () => {
    setIsConfigOpen(!isConfigOpen)
  }

  const updateConfig = (updates: Partial<ThemeInfo>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    
    // Update CSS variables in real-time
    updateCSSVariables({ ...config, ...updates })
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      console.log('Configuration saved successfully')
      
    } catch (error) {
      console.error('Error saving config:', error)
      // TODO: Add proper error handling
    } finally {
      setIsSaving(false)
    }
  }

  const resetConfig = () => {
    setConfig(initialConfig)
    updateCSSVariables(initialConfig)
  }

  const updateCSSVariables = (configData: ThemeInfo) => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    
    // Update color variables
    if (configData.colors) {
      const lightRgb = hexToRgb(configData.colors.light || '#3A8DDE') || [58, 141, 222]
      const darkRgb = hexToRgb(configData.colors.dark || '#655DC6') || [101, 93, 198]
      
      // Check current theme
      const isDark = document.documentElement.classList.contains('dark-theme')
      
      if (isDark) {
        root.style.setProperty('--color-main', darkRgb.join(' '))
      } else {
        root.style.setProperty('--color-main', lightRgb.join(' '))
      }
    }

    // Update background variables
    if (configData.background?.colors) {
      const bgLightRgb = hexToRgb(configData.background.colors.light || '#f0f0f0') || [240, 240, 240]
      const bgDarkRgb = hexToRgb(configData.background.colors.dark || '#0D0F11') || [13, 15, 17]
      
      const isDark = document.documentElement.classList.contains('dark-theme')
      
      if (isDark) {
        root.style.setProperty('--color-bg', bgDarkRgb.join(' '))
      } else {
        root.style.setProperty('--color-bg', bgLightRgb.join(' '))
      }
    }
  }

  // Update CSS variables when config changes
  useEffect(() => {
    updateCSSVariables(config)
  }, [config])

  // Listen for theme changes to update variables accordingly
  useEffect(() => {
    const observer = new MutationObserver(() => {
      updateCSSVariables(config)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [config])

  const value: ConfigContextType = {
    config,
    isConfigOpen,
    isSaving,
    toggleConfig,
    updateConfig,
    saveConfig,
    resetConfig
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

// Utility function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}