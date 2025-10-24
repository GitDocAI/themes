'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useConfig } from './ConfigContext'
import { InputText } from 'primereact/inputtext'
import { ColorPicker } from 'primereact/colorpicker'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { FileUpload } from './FileUpload'

export const ConfigEditorSidebar: React.FC = () => {
  const { config, isConfigOpen, isSaving, toggleConfig, updateConfig, saveConfig, resetConfig } = useConfig()
  
  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(384) // 384px = w-96
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('config-sidebar-width')
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      if (width >= 300 && width <= 800) { // Min/max constraints
        setSidebarWidth(width)
      }
    }
  }, [])
  
  // Save width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('config-sidebar-width', sidebarWidth.toString())
  }, [sidebarWidth])
  
  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = window.innerWidth - e.clientX
    const minWidth = 300
    const maxWidth = 800
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth)
    }
  }, [isResizing])
  
  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])
  
  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleColorChange = (field: 'light' | 'dark', value: string) => {
    const newColors = {
      light: field === 'light' ? `#${value}` : config.colors?.light || '#3A8DDE',
      dark: field === 'dark' ? `#${value}` : config.colors?.dark || '#655DC6'
    }
    updateConfig({ colors: newColors })
  }

  const handleBackgroundColorChange = (field: 'light' | 'dark', value: string) => {
    const newBackground = {
      ...config.background,
      colors: {
        light: field === 'light' ? `#${value}` : config.background?.colors?.light || '#f0f0f0',
        dark: field === 'dark' ? `#${value}` : config.background?.colors?.dark || '#0D0F11'
      }
    }
    updateConfig({ background: newBackground })
  }

  const handleBasicFieldChange = (field: string, value: string) => {
    updateConfig({ [field]: value })
  }

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
  ]

  if (!isConfigOpen) return null

  return (
    <div 
      ref={sidebarRef}
      className="fixed right-0 top-0 h-screen bg-[rgb(var(--color-bg))] border-l border-[rgb(var(--color-muted))]/20 shadow-2xl z-50 overflow-y-auto"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-[rgb(var(--color-primary))]/20 transition-all duration-150 z-10 group"
        onMouseDown={handleResizeStart}
        style={{
          background: isResizing ? 'rgb(var(--color-primary))/30' : 'transparent'
        }}
      >
        {/* Visual indicator */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-8 bg-[rgb(var(--color-muted))]/60 rounded-full"></div>
            <div className="w-0.5 h-8 bg-[rgb(var(--color-muted))]/60 rounded-full"></div>
          </div>
        </div>
        
        {/* Active resize indicator */}
        {isResizing && (
          <div className="absolute left-1/2 top-4 transform -translate-x-1/2 bg-[rgb(var(--color-primary))] text-white text-xs px-2 py-1 rounded shadow-lg">
            {sidebarWidth}px
          </div>
        )}
      </div>
      <div className="p-6 pl-8"> {/* Added extra left padding to account for resize handle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[rgb(var(--color-main))]">Theme Editor</h2>
            <div className="flex items-center gap-2">
              <div className="text-xs text-[rgb(var(--color-muted))]/60">
                {sidebarWidth}px
              </div>
              {sidebarWidth !== 384 && (
                <Button
                  icon="pi pi-refresh"
                  className="p-button-text p-button-sm"
                  onClick={() => setSidebarWidth(384)}
                  aria-label="Reset width"
                  tooltip="Reset to default width"
                  style={{
                    color: 'rgb(var(--color-muted))',
                    backgroundColor: 'transparent',
                    fontSize: '10px',
                    padding: '2px 4px'
                  }}
                />
              )}
            </div>
          </div>
          <Button
            icon="pi pi-times"
            className="p-button-text p-button-sm"
            onClick={toggleConfig}
            aria-label="Close"
            style={{
              color: 'rgb(var(--color-muted))',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Basic Settings */}
        <Card 
          title="Basic Settings" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Site Name</label>
              <InputText
                value={config.name || ''}
                onChange={(e) => handleBasicFieldChange('name', e.target.value)}
                className="w-full"
                style={{
                  backgroundColor: 'rgb(var(--color-bg))',
                  border: '1px solid rgb(var(--color-muted))',
                  color: 'rgb(var(--color-main))'
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Description</label>
              <InputText
                value={config.description || ''}
                onChange={(e) => handleBasicFieldChange('description', e.target.value)}
                className="w-full"
                style={{
                  backgroundColor: 'rgb(var(--color-bg))',
                  border: '1px solid rgb(var(--color-muted))',
                  color: 'rgb(var(--color-main))'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Default Theme Mode</label>
              <Dropdown
                value={config.defaultThemeMode}
                options={themeOptions}
                onChange={(e) => handleBasicFieldChange('defaultThemeMode', e.value)}
                className="w-full"
                style={{
                  backgroundColor: 'rgb(var(--color-bg))',
                  border: '1px solid rgb(var(--color-muted))',
                  color: 'rgb(var(--color-main))'
                }}
              />
            </div>
          </div>
        </Card>

        {/* Colors */}
        <Card 
          title="Theme Colors" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Primary Color (Light Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={config.colors?.light?.replace('#', '') || '3A8DDE'}
                    onChange={(e) => handleColorChange('light', e.value as string)}
                  />
                </div>
                <InputText
                  value={config.colors?.light || '#3A8DDE'}
                  onChange={(e) => handleColorChange('light', e.target.value.replace('#', ''))}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Primary Color (Dark Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={config.colors?.dark?.replace('#', '') || '655DC6'}
                    onChange={(e) => handleColorChange('dark', e.value as string)}
                  />
                </div>
                <InputText
                  value={config.colors?.dark || '#655DC6'}
                  onChange={(e) => handleColorChange('dark', e.target.value.replace('#', ''))}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Background */}
        <Card 
          title="Background" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Background (Light Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={config.background?.colors?.light?.replace('#', '') || 'f0f0f0'}
                    onChange={(e) => handleBackgroundColorChange('light', e.value as string)}
                  />
                </div>
                <InputText
                  value={config.background?.colors?.light || '#f0f0f0'}
                  onChange={(e) => handleBackgroundColorChange('light', e.target.value.replace('#', ''))}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Background (Dark Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={config.background?.colors?.dark?.replace('#', '') || '0D0F11'}
                    onChange={(e) => handleBackgroundColorChange('dark', e.value as string)}
                  />
                </div>
                <InputText
                  value={config.background?.colors?.dark || '#0D0F11'}
                  onChange={(e) => handleBackgroundColorChange('dark', e.target.value.replace('#', ''))}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Banner */}
        <Card 
          title="Banner" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Banner Message</label>
              <InputText
                value={typeof config.banner === 'object' ? config.banner?.message || '' : config.banner || ''}
                onChange={(e) => {
                  const newBanner = {
                    message: e.target.value,
                    colors: typeof config.banner === 'object' ? config.banner?.colors : undefined
                  }
                  updateConfig({ banner: newBanner })
                }}
                className="w-full"
                style={{
                  backgroundColor: 'rgb(var(--color-bg))',
                  border: '1px solid rgb(var(--color-muted))',
                  color: 'rgb(var(--color-main))'
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Banner Color (Light Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={
                      (typeof config.banner === 'object' ? config.banner?.colors?.light : config.colors?.light)?.replace('#', '') || '3A8DDE'
                    }
                    onChange={(e) => {
                      const currentBanner = typeof config.banner === 'object' ? config.banner : { message: config.banner || '' }
                      const newBanner = {
                        ...currentBanner,
                        colors: {
                          light: `#${e.value}`,
                          dark: currentBanner.colors?.dark || config.colors?.dark || '#655DC6'
                        }
                      }
                      updateConfig({ banner: newBanner })
                    }}
                  />
                </div>
                <InputText
                  value={
                    (typeof config.banner === 'object' ? config.banner?.colors?.light : config.colors?.light) || '#3A8DDE'
                  }
                  onChange={(e) => {
                    const currentBanner = typeof config.banner === 'object' ? config.banner : { message: config.banner || '' }
                    const newBanner = {
                      ...currentBanner,
                      colors: {
                        light: e.target.value.startsWith('#') ? e.target.value : `#${e.target.value.replace('#', '')}`,
                        dark: currentBanner.colors?.dark || config.colors?.dark || '#655DC6'
                      }
                    }
                    updateConfig({ banner: newBanner })
                  }}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Banner Color (Dark Mode)</label>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <ColorPicker
                    value={
                      (typeof config.banner === 'object' ? config.banner?.colors?.dark : config.colors?.dark)?.replace('#', '') || '655DC6'
                    }
                    onChange={(e) => {
                      const currentBanner = typeof config.banner === 'object' ? config.banner : { message: config.banner || '' }
                      const newBanner = {
                        ...currentBanner,
                        colors: {
                          light: currentBanner.colors?.light || config.colors?.light || '#3A8DDE',
                          dark: `#${e.value}`
                        }
                      }
                      updateConfig({ banner: newBanner })
                    }}
                  />
                </div>
                <InputText
                  value={
                    (typeof config.banner === 'object' ? config.banner?.colors?.dark : config.colors?.dark) || '#655DC6'
                  }
                  onChange={(e) => {
                    const currentBanner = typeof config.banner === 'object' ? config.banner : { message: config.banner || '' }
                    const newBanner = {
                      ...currentBanner,
                      colors: {
                        light: currentBanner.colors?.light || config.colors?.light || '#3A8DDE',
                        dark: e.target.value.startsWith('#') ? e.target.value : `#${e.target.value.replace('#', '')}`
                      }
                    }
                    updateConfig({ banner: newBanner })
                  }}
                  className="flex-1 min-w-0"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Logo */}
        <Card 
          title="Logo & Assets" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Light Logo Path</label>
              <div className="flex flex-col gap-2">
                <InputText
                  value={config.logo?.light || ''}
                  onChange={(e) => {
                    const newLogo = { ...config.logo, light: e.target.value }
                    updateConfig({ logo: newLogo })
                  }}
                  className="w-full"
                  placeholder="/assets/light.svg"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
                <FileUpload
                  onUpload={(url) => {
                    const newLogo = { ...config.logo, light: url }
                    updateConfig({ logo: newLogo })
                  }}
                  buttonLabel="Upload Logo"
                  currentValue={config.logo?.light}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Dark Logo Path</label>
              <div className="flex flex-col gap-2">
                <InputText
                  value={config.logo?.dark || ''}
                  onChange={(e) => {
                    const newLogo = { ...config.logo, dark: e.target.value }
                    updateConfig({ logo: newLogo })
                  }}
                  className="w-full"
                  placeholder="/assets/dark.svg"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
                <FileUpload
                  onUpload={(url) => {
                    const newLogo = { ...config.logo, dark: url }
                    updateConfig({ logo: newLogo })
                  }}
                  buttonLabel="Upload Logo"
                  currentValue={config.logo?.dark}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-muted))]">Favicon Path</label>
              <div className="flex flex-col gap-2">
                <InputText
                  value={config.favicon || ''}
                  onChange={(e) => handleBasicFieldChange('favicon', e.target.value)}
                  className="w-full"
                  placeholder="/assets/favicon.svg"
                  style={{
                    backgroundColor: 'rgb(var(--color-bg))',
                    border: '1px solid rgb(var(--color-muted))',
                    color: 'rgb(var(--color-main))'
                  }}
                />
                <FileUpload
                  onUpload={(url) => handleBasicFieldChange('favicon', url)}
                  buttonLabel="Upload Favicon"
                  currentValue={config.favicon}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Navbar */}
        <Card 
          title="Navigation Bar" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            {config.navbar?.map((item, index) => (
              <div key={index} className="border border-[rgb(var(--color-muted))]/30 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[rgb(var(--color-muted))]">Item {index + 1}</span>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-sm"
                    onClick={() => {
                      const newNavbar = config.navbar?.filter((_, i) => i !== index) || []
                      updateConfig({ navbar: newNavbar })
                    }}
                    style={{ color: 'rgb(var(--color-muted))' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Type</label>
                    <Dropdown
                      value={item.type}
                      options={[
                        { label: 'Link', value: 'link' },
                        { label: 'Button', value: 'button' }
                      ]}
                      onChange={(e) => {
                        const newNavbar = [...(config.navbar || [])]
                        newNavbar[index] = { ...item, type: e.value }
                        updateConfig({ navbar: newNavbar })
                      }}
                      className="w-full text-sm"
                      style={{
                        backgroundColor: 'rgb(var(--color-bg))',
                        border: '1px solid rgb(var(--color-muted))',
                        color: 'rgb(var(--color-main))'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Label</label>
                    <InputText
                      value={item.label || ''}
                      onChange={(e) => {
                        const newNavbar = [...(config.navbar || [])]
                        newNavbar[index] = { ...item, label: e.target.value }
                        updateConfig({ navbar: newNavbar })
                      }}
                      className="w-full text-sm"
                      style={{
                        backgroundColor: 'rgb(var(--color-bg))',
                        border: '1px solid rgb(var(--color-muted))',
                        color: 'rgb(var(--color-main))'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Reference/URL</label>
                    <InputText
                      value={item.reference || ''}
                      onChange={(e) => {
                        const newNavbar = [...(config.navbar || [])]
                        newNavbar[index] = { ...item, reference: e.target.value }
                        updateConfig({ navbar: newNavbar })
                      }}
                      className="w-full text-sm"
                      style={{
                        backgroundColor: 'rgb(var(--color-bg))',
                        border: '1px solid rgb(var(--color-muted))',
                        color: 'rgb(var(--color-main))'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              label="Add Navbar Item"
              icon="pi pi-plus"
              onClick={() => {
                const newNavbar = [...(config.navbar || []), { type: 'link', label: '', reference: '' }]
                updateConfig({ navbar: newNavbar })
              }}
              style={{
                borderColor: 'rgb(var(--color-muted))',
                color: 'rgb(var(--color-muted))',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            />
          </div>
        </Card>

        {/* Footer */}
        <Card 
          title="Footer" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            {config.footer?.map((item, index) => (
              <div key={index} className="border border-[rgb(var(--color-muted))]/30 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[rgb(var(--color-muted))]">Item {index + 1}</span>
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-sm"
                    onClick={() => {
                      const newFooter = config.footer?.filter((_, i) => i !== index) || []
                      updateConfig({ footer: newFooter })
                    }}
                    style={{ color: 'rgb(var(--color-muted))' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Type</label>
                    <Dropdown
                      value={item.type}
                      options={[
                        { label: 'GitHub', value: 'github' },
                        { label: 'X (Twitter)', value: 'x' },
                        { label: 'LinkedIn', value: 'linkedin' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'YouTube', value: 'youtube' }
                      ]}
                      onChange={(e) => {
                        const newFooter = [...(config.footer || [])]
                        newFooter[index] = { ...item, type: e.value }
                        updateConfig({ footer: newFooter })
                      }}
                      className="w-full text-sm"
                      style={{
                        backgroundColor: 'rgb(var(--color-bg))',
                        border: '1px solid rgb(var(--color-muted))',
                        color: 'rgb(var(--color-main))'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">
                      {item.type === 'github' ? 'GitHub URL' : 
                       item.type === 'x' ? 'X (Twitter) URL' :
                       item.type === 'linkedin' ? 'LinkedIn URL' :
                       item.type === 'facebook' ? 'Facebook URL' :
                       item.type === 'youtube' ? 'YouTube URL' : 'URL'}
                    </label>
                    <InputText
                      value={item.reference || ''}
                      onChange={(e) => {
                        const newFooter = [...(config.footer || [])]
                        newFooter[index] = { ...item, reference: e.target.value }
                        updateConfig({ footer: newFooter })
                      }}
                      className="w-full text-sm"
                      placeholder={
                        item.type === 'github' ? 'https://github.com/username' :
                        item.type === 'x' ? 'https://x.com/username' :
                        item.type === 'linkedin' ? 'https://linkedin.com/in/username' :
                        item.type === 'facebook' ? 'https://facebook.com/username' :
                        item.type === 'youtube' ? 'https://youtube.com/@username' : 'https://example.com'
                      }
                      style={{
                        backgroundColor: 'rgb(var(--color-bg))',
                        border: '1px solid rgb(var(--color-muted))',
                        color: 'rgb(var(--color-main))'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              label="Add Footer Item"
              icon="pi pi-plus"
              onClick={() => {
                const newFooter = [...(config.footer || []), { type: 'github', reference: '' }]
                updateConfig({ footer: newFooter })
              }}
              style={{
                borderColor: 'rgb(var(--color-muted))',
                color: 'rgb(var(--color-muted))',
                borderRadius: '6px',
                fontWeight: '500'
              }}
            />
          </div>
        </Card>

        {/* Navigation */}
        <Card 
          title="Navigation Structure" 
          className="mb-4"
          style={{
            backgroundColor: 'rgb(var(--color-bg))',
            border: '1px solid rgb(var(--color-muted))',
            borderRadius: '8px'
          }}
        >
          <div className="space-y-4">
            <div className="text-sm text-[rgb(var(--color-muted))] mb-4">
              Configure your documentation navigation structure including versions, tabs, and content organization.
            </div>
            
            {/* Versions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-[rgb(var(--color-main))]">Versions</h4>
                <Button
                  label="Add Version"
                  icon="pi pi-plus"
                  size="small"
                  onClick={() => {
                    const newVersions = [...(config.navigation?.versions || []), {
                      version: 'v1.0.0',
                      tabs: [{
                        tab: 'Documentation',
                        items: []
                      }]
                    }]
                    updateConfig({
                      navigation: {
                        ...config.navigation,
                        versions: newVersions
                      }
                    })
                  }}
                  style={{
                    borderColor: 'rgb(var(--color-muted))',
                    color: 'rgb(var(--color-muted))',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              
              {config.navigation?.versions?.map((version, versionIndex) => (
                <div key={versionIndex} className="border border-[rgb(var(--color-muted))]/30 rounded p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[rgb(var(--color-muted))]">
                      Version {versionIndex + 1}
                    </span>
                    <Button
                      icon="pi pi-trash"
                      className="p-button-text p-button-sm"
                      onClick={() => {
                        const newVersions = config.navigation?.versions?.filter((_, i) => i !== versionIndex) || []
                        updateConfig({
                          navigation: {
                            ...config.navigation,
                            versions: newVersions
                          }
                        })
                      }}
                      style={{ color: 'rgb(var(--color-muted))' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Version Name</label>
                      <InputText
                        value={version.version || ''}
                        onChange={(e) => {
                          const newVersions = [...(config.navigation?.versions || [])]
                          newVersions[versionIndex] = { ...version, version: e.target.value }
                          updateConfig({
                            navigation: {
                              ...config.navigation,
                              versions: newVersions
                            }
                          })
                        }}
                        className="w-full text-sm"
                        placeholder="v1.0.0"
                        style={{
                          backgroundColor: 'rgb(var(--color-bg))',
                          border: '1px solid rgb(var(--color-muted))',
                          color: 'rgb(var(--color-main))'
                        }}
                      />
                    </div>
                    
                    {/* Tabs for this version */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-[rgb(var(--color-muted))]">Tabs</label>
                        <Button
                          label="Add Tab"
                          icon="pi pi-plus"
                          size="small"
                          onClick={() => {
                            const newVersions = [...(config.navigation?.versions || [])]
                            const newTabs = [...(version.tabs || []), { tab: 'New Tab', items: [] }]
                            newVersions[versionIndex] = { ...version, tabs: newTabs }
                            updateConfig({
                              navigation: {
                                ...config.navigation,
                                versions: newVersions
                              }
                            })
                          }}
                          style={{
                            borderColor: 'rgb(var(--color-muted))',
                            color: 'rgb(var(--color-muted))',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}
                        />
                      </div>
                      
                      {version.tabs?.map((tab, tabIndex) => (
                        <div key={tabIndex} className="border border-[rgb(var(--color-muted))]/20 rounded p-3 mb-2 bg-[rgb(var(--color-bg))]/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[rgb(var(--color-muted))]">
                              Tab {tabIndex + 1}
                            </span>
                            <Button
                              icon="pi pi-trash"
                              className="p-button-text p-button-sm"
                              onClick={() => {
                                const newVersions = [...(config.navigation?.versions || [])]
                                const newTabs = version.tabs?.filter((_, i) => i !== tabIndex) || []
                                newVersions[versionIndex] = { ...version, tabs: newTabs }
                                updateConfig({
                                  navigation: {
                                    ...config.navigation,
                                    versions: newVersions
                                  }
                                })
                              }}
                              style={{ color: 'rgb(var(--color-muted))' }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Tab Name</label>
                            <InputText
                              value={tab.tab || ''}
                              onChange={(e) => {
                                const newVersions = [...(config.navigation?.versions || [])]
                                const newTabs = [...(version.tabs || [])]
                                newTabs[tabIndex] = { ...tab, tab: e.target.value }
                                newVersions[versionIndex] = { ...version, tabs: newTabs }
                                updateConfig({
                                  navigation: {
                                    ...config.navigation,
                                    versions: newVersions
                                  }
                                })
                              }}
                              className="w-full text-xs"
                              placeholder="Documentation"
                              style={{
                                backgroundColor: 'rgb(var(--color-bg))',
                                border: '1px solid rgb(var(--color-muted))',
                                color: 'rgb(var(--color-main))'
                              }}
                            />
                          </div>
                          
                          {/* Items in this tab */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-medium text-[rgb(var(--color-muted))]">Items</label>
                              <div className="flex gap-1">
                                <Button
                                  label="Group"
                                  size="small"
                                  onClick={() => {
                                    const newVersions = [...(config.navigation?.versions || [])]
                                    const newTabs = [...(version.tabs || [])]
                                    const newItems = [...(tab.items || []), {
                                      type: 'group' as const,
                                      title: 'New Group',
                                      children: []
                                    }]
                                    newTabs[tabIndex] = { ...tab, items: newItems }
                                    newVersions[versionIndex] = { ...version, tabs: newTabs }
                                    updateConfig({
                                      navigation: {
                                        ...config.navigation,
                                        versions: newVersions
                                      }
                                    })
                                  }}
                                  style={{
                                    borderColor: 'rgb(var(--color-muted))',
                                    color: 'rgb(var(--color-muted))',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    padding: '4px 8px'
                                  }}
                                />
                                <Button
                                  label="Page"
                                  size="small"
                                  onClick={() => {
                                    const newVersions = [...(config.navigation?.versions || [])]
                                    const newTabs = [...(version.tabs || [])]
                                    const newItems = [...(tab.items || []), {
                                      type: 'page' as const,
                                      title: 'New Page',
                                      page: '/path/to/page'
                                    }]
                                    newTabs[tabIndex] = { ...tab, items: newItems }
                                    newVersions[versionIndex] = { ...version, tabs: newTabs }
                                    updateConfig({
                                      navigation: {
                                        ...config.navigation,
                                        versions: newVersions
                                      }
                                    })
                                  }}
                                  style={{
                                    borderColor: 'rgb(var(--color-muted))',
                                    color: 'rgb(var(--color-muted))',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    padding: '4px 8px'
                                  }}
                                />
                                <Button
                                  label="OpenAPI"
                                  size="small"
                                  onClick={() => {
                                    const newVersions = [...(config.navigation?.versions || [])]
                                    const newTabs = [...(version.tabs || [])]
                                    const newItems = [...(tab.items || []), {
                                      type: 'openapi' as const,
                                      title: 'New API Endpoint',
                                      method: 'GET',
                                      reference: '/api/endpoint',
                                      page: '/path/to/api/page'
                                    }]
                                    newTabs[tabIndex] = { ...tab, items: newItems }
                                    newVersions[versionIndex] = { ...version, tabs: newTabs }
                                    updateConfig({
                                      navigation: {
                                        ...config.navigation,
                                        versions: newVersions
                                      }
                                    })
                                  }}
                                  style={{
                                    borderColor: 'rgb(var(--color-muted))',
                                    color: 'rgb(var(--color-muted))',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    padding: '4px 8px'
                                  }}
                                />
                              </div>
                            </div>
                            
                            {tab.items?.map((item, itemIndex) => (
                              <div key={itemIndex} className="border border-[rgb(var(--color-muted))]/15 rounded p-2 mb-2 bg-[rgb(var(--color-bg))]/30">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-[rgb(var(--color-muted))]">
                                    {item.type === 'group' ? '📁' : item.type === 'page' ? '📄' : '🔗'} {item.type}
                                  </span>
                                  <Button
                                    icon="pi pi-trash"
                                    className="p-button-text p-button-sm"
                                    onClick={() => {
                                      const newVersions = [...(config.navigation?.versions || [])]
                                      const newTabs = [...(version.tabs || [])]
                                      const newItems = tab.items?.filter((_, i) => i !== itemIndex) || []
                                      newTabs[tabIndex] = { ...tab, items: newItems }
                                      newVersions[versionIndex] = { ...version, tabs: newTabs }
                                      updateConfig({
                                        navigation: {
                                          ...config.navigation,
                                          versions: newVersions
                                        }
                                      })
                                    }}
                                    style={{ color: 'rgb(var(--color-muted))', fontSize: '10px' }}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Title</label>
                                    <InputText
                                      value={item.title || ''}
                                      onChange={(e) => {
                                        const newVersions = [...(config.navigation?.versions || [])]
                                        const newTabs = [...(version.tabs || [])]
                                        const newItems = [...(tab.items || [])]
                                        newItems[itemIndex] = { ...item, title: e.target.value }
                                        newTabs[tabIndex] = { ...tab, items: newItems }
                                        newVersions[versionIndex] = { ...version, tabs: newTabs }
                                        updateConfig({
                                          navigation: {
                                            ...config.navigation,
                                            versions: newVersions
                                          }
                                        })
                                      }}
                                      className="w-full text-xs"
                                      style={{
                                        backgroundColor: 'rgb(var(--color-bg))',
                                        border: '1px solid rgb(var(--color-muted))',
                                        color: 'rgb(var(--color-main))'
                                      }}
                                    />
                                  </div>
                                  
                                  {item.type === 'page' && (
                                    <div>
                                      <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Page Path</label>
                                      <InputText
                                        value={(item as any).page || ''}
                                        onChange={(e) => {
                                          const newVersions = [...(config.navigation?.versions || [])]
                                          const newTabs = [...(version.tabs || [])]
                                          const newItems = [...(tab.items || [])]
                                          newItems[itemIndex] = { ...item, page: e.target.value }
                                          newTabs[tabIndex] = { ...tab, items: newItems }
                                          newVersions[versionIndex] = { ...version, tabs: newTabs }
                                          updateConfig({
                                            navigation: {
                                              ...config.navigation,
                                              versions: newVersions
                                            }
                                          })
                                        }}
                                        className="w-full text-xs"
                                        placeholder="/v1.0.0/documentation/page"
                                        style={{
                                          backgroundColor: 'rgb(var(--color-bg))',
                                          border: '1px solid rgb(var(--color-muted))',
                                          color: 'rgb(var(--color-main))'
                                        }}
                                      />
                                    </div>
                                  )}
                                  
                                  {item.type === 'openapi' && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Method</label>
                                        <Dropdown
                                          value={(item as any).method || 'GET'}
                                          options={[
                                            { label: 'GET', value: 'GET' },
                                            { label: 'POST', value: 'POST' },
                                            { label: 'PUT', value: 'PUT' },
                                            { label: 'DELETE', value: 'DELETE' },
                                            { label: 'PATCH', value: 'PATCH' }
                                          ]}
                                          onChange={(e) => {
                                            const newVersions = [...(config.navigation?.versions || [])]
                                            const newTabs = [...(version.tabs || [])]
                                            const newItems = [...(tab.items || [])]
                                            newItems[itemIndex] = { ...item, method: e.value }
                                            newTabs[tabIndex] = { ...tab, items: newItems }
                                            newVersions[versionIndex] = { ...version, tabs: newTabs }
                                            updateConfig({
                                              navigation: {
                                                ...config.navigation,
                                                versions: newVersions
                                              }
                                            })
                                          }}
                                          className="w-full text-xs"
                                          style={{
                                            backgroundColor: 'rgb(var(--color-bg))',
                                            border: '1px solid rgb(var(--color-muted))',
                                            color: 'rgb(var(--color-main))'
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Reference</label>
                                        <InputText
                                          value={(item as any).reference || ''}
                                          onChange={(e) => {
                                            const newVersions = [...(config.navigation?.versions || [])]
                                            const newTabs = [...(version.tabs || [])]
                                            const newItems = [...(tab.items || [])]
                                            newItems[itemIndex] = { ...item, reference: e.target.value }
                                            newTabs[tabIndex] = { ...tab, items: newItems }
                                            newVersions[versionIndex] = { ...version, tabs: newTabs }
                                            updateConfig({
                                              navigation: {
                                                ...config.navigation,
                                                versions: newVersions
                                              }
                                            })
                                          }}
                                          className="w-full text-xs"
                                          placeholder="/api/endpoint"
                                          style={{
                                            backgroundColor: 'rgb(var(--color-bg))',
                                            border: '1px solid rgb(var(--color-muted))',
                                            color: 'rgb(var(--color-main))'
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Page Path</label>
                                        <InputText
                                          value={(item as any).page || ''}
                                          onChange={(e) => {
                                            const newVersions = [...(config.navigation?.versions || [])]
                                            const newTabs = [...(version.tabs || [])]
                                            const newItems = [...(tab.items || [])]
                                            newItems[itemIndex] = { ...item, page: e.target.value }
                                            newTabs[tabIndex] = { ...tab, items: newItems }
                                            newVersions[versionIndex] = { ...version, tabs: newTabs }
                                            updateConfig({
                                              navigation: {
                                                ...config.navigation,
                                                versions: newVersions
                                              }
                                            })
                                          }}
                                          className="w-full text-xs"
                                          placeholder="/v1.0.0/api_reference/openapi.json"
                                          style={{
                                            backgroundColor: 'rgb(var(--color-bg))',
                                            border: '1px solid rgb(var(--color-muted))',
                                            color: 'rgb(var(--color-main))'
                                          }}
                                        />
                                      </div>
                                    </>
                                  )}
                                  
                                  {item.type === 'group' && (
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-[rgb(var(--color-muted))]">Children</label>
                                        <div className="flex gap-1">
                                          <Button
                                            label="Page"
                                            size="small"
                                            onClick={() => {
                                              const newVersions = [...(config.navigation?.versions || [])]
                                              const newTabs = [...(version.tabs || [])]
                                              const newItems = [...(tab.items || [])]
                                              const currentChildren = (item as any).children || []
                                              const newChild = {
                                                type: 'page' as const,
                                                title: 'New Page',
                                                page: '/path/to/page'
                                              }
                                              newItems[itemIndex] = { ...item, children: [...currentChildren, newChild] }
                                              newTabs[tabIndex] = { ...tab, items: newItems }
                                              newVersions[versionIndex] = { ...version, tabs: newTabs }
                                              updateConfig({
                                                navigation: {
                                                  ...config.navigation,
                                                  versions: newVersions
                                                }
                                              })
                                            }}
                                            style={{
                                              borderColor: 'rgb(var(--color-muted))',
                                              color: 'rgb(var(--color-muted))',
                                              borderRadius: '3px',
                                              fontSize: '9px',
                                              padding: '2px 6px'
                                            }}
                                          />
                                          <Button
                                            label="API"
                                            size="small"
                                            onClick={() => {
                                              const newVersions = [...(config.navigation?.versions || [])]
                                              const newTabs = [...(version.tabs || [])]
                                              const newItems = [...(tab.items || [])]
                                              const currentChildren = (item as any).children || []
                                              const newChild = {
                                                type: 'openapi' as const,
                                                title: 'New API',
                                                method: 'GET',
                                                reference: '/api/endpoint',
                                                page: '/path/to/api/page'
                                              }
                                              newItems[itemIndex] = { ...item, children: [...currentChildren, newChild] }
                                              newTabs[tabIndex] = { ...tab, items: newItems }
                                              newVersions[versionIndex] = { ...version, tabs: newTabs }
                                              updateConfig({
                                                navigation: {
                                                  ...config.navigation,
                                                  versions: newVersions
                                                }
                                              })
                                            }}
                                            style={{
                                              borderColor: 'rgb(var(--color-muted))',
                                              color: 'rgb(var(--color-muted))',
                                              borderRadius: '3px',
                                              fontSize: '9px',
                                              padding: '2px 6px'
                                            }}
                                          />
                                        </div>
                                      </div>
                                      
                                      {(item as any).children?.map((child: any, childIndex: number) => (
                                        <div key={childIndex} className="border border-[rgb(var(--color-muted))]/10 rounded p-2 mb-1 bg-[rgb(var(--color-bg))]/20">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-[rgb(var(--color-muted))]">
                                              {child.type === 'page' ? '📄' : '🔗'} {child.type}
                                            </span>
                                            <Button
                                              icon="pi pi-trash"
                                              className="p-button-text p-button-sm"
                                              onClick={() => {
                                                const newVersions = [...(config.navigation?.versions || [])]
                                                const newTabs = [...(version.tabs || [])]
                                                const newItems = [...(tab.items || [])]
                                                const newChildren = (item as any).children?.filter((_: any, i: number) => i !== childIndex) || []
                                                newItems[itemIndex] = { ...item, children: newChildren }
                                                newTabs[tabIndex] = { ...tab, items: newItems }
                                                newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                updateConfig({
                                                  navigation: {
                                                    ...config.navigation,
                                                    versions: newVersions
                                                  }
                                                })
                                              }}
                                              style={{ color: 'rgb(var(--color-muted))', fontSize: '8px' }}
                                            />
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <div>
                                              <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Title</label>
                                              <InputText
                                                value={child.title || ''}
                                                onChange={(e) => {
                                                  const newVersions = [...(config.navigation?.versions || [])]
                                                  const newTabs = [...(version.tabs || [])]
                                                  const newItems = [...(tab.items || [])]
                                                  const newChildren = [...((item as any).children || [])]
                                                  newChildren[childIndex] = { ...child, title: e.target.value }
                                                  newItems[itemIndex] = { ...item, children: newChildren }
                                                  newTabs[tabIndex] = { ...tab, items: newItems }
                                                  newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                  updateConfig({
                                                    navigation: {
                                                      ...config.navigation,
                                                      versions: newVersions
                                                    }
                                                  })
                                                }}
                                                className="w-full text-xs"
                                                style={{
                                                  backgroundColor: 'rgb(var(--color-bg))',
                                                  border: '1px solid rgb(var(--color-muted))',
                                                  color: 'rgb(var(--color-main))'
                                                }}
                                              />
                                            </div>
                                            
                                            {child.type === 'page' && (
                                              <div>
                                                <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Page Path</label>
                                                <InputText
                                                  value={child.page || ''}
                                                  onChange={(e) => {
                                                    const newVersions = [...(config.navigation?.versions || [])]
                                                    const newTabs = [...(version.tabs || [])]
                                                    const newItems = [...(tab.items || [])]
                                                    const newChildren = [...((item as any).children || [])]
                                                    newChildren[childIndex] = { ...child, page: e.target.value }
                                                    newItems[itemIndex] = { ...item, children: newChildren }
                                                    newTabs[tabIndex] = { ...tab, items: newItems }
                                                    newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                    updateConfig({
                                                      navigation: {
                                                        ...config.navigation,
                                                        versions: newVersions
                                                      }
                                                    })
                                                  }}
                                                  className="w-full text-xs"
                                                  placeholder="/v1.0.0/documentation/page"
                                                  style={{
                                                    backgroundColor: 'rgb(var(--color-bg))',
                                                    border: '1px solid rgb(var(--color-muted))',
                                                    color: 'rgb(var(--color-main))'
                                                  }}
                                                />
                                              </div>
                                            )}
                                            
                                            {child.type === 'openapi' && (
                                              <>
                                                <div>
                                                  <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Method</label>
                                                  <Dropdown
                                                    value={child.method || 'GET'}
                                                    options={[
                                                      { label: 'GET', value: 'GET' },
                                                      { label: 'POST', value: 'POST' },
                                                      { label: 'PUT', value: 'PUT' },
                                                      { label: 'DELETE', value: 'DELETE' },
                                                      { label: 'PATCH', value: 'PATCH' }
                                                    ]}
                                                    onChange={(e) => {
                                                      const newVersions = [...(config.navigation?.versions || [])]
                                                      const newTabs = [...(version.tabs || [])]
                                                      const newItems = [...(tab.items || [])]
                                                      const newChildren = [...((item as any).children || [])]
                                                      newChildren[childIndex] = { ...child, method: e.value }
                                                      newItems[itemIndex] = { ...item, children: newChildren }
                                                      newTabs[tabIndex] = { ...tab, items: newItems }
                                                      newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                      updateConfig({
                                                        navigation: {
                                                          ...config.navigation,
                                                          versions: newVersions
                                                        }
                                                      })
                                                    }}
                                                    className="w-full text-xs"
                                                    style={{
                                                      backgroundColor: 'rgb(var(--color-bg))',
                                                      border: '1px solid rgb(var(--color-muted))',
                                                      color: 'rgb(var(--color-main))'
                                                    }}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Reference</label>
                                                  <InputText
                                                    value={child.reference || ''}
                                                    onChange={(e) => {
                                                      const newVersions = [...(config.navigation?.versions || [])]
                                                      const newTabs = [...(version.tabs || [])]
                                                      const newItems = [...(tab.items || [])]
                                                      const newChildren = [...((item as any).children || [])]
                                                      newChildren[childIndex] = { ...child, reference: e.target.value }
                                                      newItems[itemIndex] = { ...item, children: newChildren }
                                                      newTabs[tabIndex] = { ...tab, items: newItems }
                                                      newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                      updateConfig({
                                                        navigation: {
                                                          ...config.navigation,
                                                          versions: newVersions
                                                        }
                                                      })
                                                    }}
                                                    className="w-full text-xs"
                                                    placeholder="/api/endpoint"
                                                    style={{
                                                      backgroundColor: 'rgb(var(--color-bg))',
                                                      border: '1px solid rgb(var(--color-muted))',
                                                      color: 'rgb(var(--color-main))'
                                                    }}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">Page Path</label>
                                                  <InputText
                                                    value={child.page || ''}
                                                    onChange={(e) => {
                                                      const newVersions = [...(config.navigation?.versions || [])]
                                                      const newTabs = [...(version.tabs || [])]
                                                      const newItems = [...(tab.items || [])]
                                                      const newChildren = [...((item as any).children || [])]
                                                      newChildren[childIndex] = { ...child, page: e.target.value }
                                                      newItems[itemIndex] = { ...item, children: newChildren }
                                                      newTabs[tabIndex] = { ...tab, items: newItems }
                                                      newVersions[versionIndex] = { ...version, tabs: newTabs }
                                                      updateConfig({
                                                        navigation: {
                                                          ...config.navigation,
                                                          versions: newVersions
                                                        }
                                                      })
                                                    }}
                                                    className="w-full text-xs"
                                                    placeholder="/v1.0.0/api_reference/page"
                                                    style={{
                                                      backgroundColor: 'rgb(var(--color-bg))',
                                                      border: '1px solid rgb(var(--color-muted))',
                                                      color: 'rgb(var(--color-main))'
                                                    }}
                                                  />
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {(!(item as any).children || (item as any).children.length === 0) && (
                                        <div className="text-center text-xs text-[rgb(var(--color-muted))]/50 py-2 border border-dashed border-[rgb(var(--color-muted))]/15 rounded">
                                          No children. Click "Page" or "API" to add content.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {(!tab.items || tab.items.length === 0) && (
                              <div className="text-center text-xs text-[rgb(var(--color-muted))]/60 py-2 border border-dashed border-[rgb(var(--color-muted))]/20 rounded">
                                No items. Click "Group" or "Page" to add content.
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs text-[rgb(var(--color-muted))]/70">
                            Items: {tab.items?.length || 0} configured
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!config.navigation?.versions || config.navigation.versions.length === 0) && (
                <div className="text-center text-sm text-[rgb(var(--color-muted))]/70 py-4 border border-dashed border-[rgb(var(--color-muted))]/30 rounded">
                  No versions configured. Click "Add Version" to create your first version.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Divider style={{ borderColor: 'rgb(var(--color-muted))' }} />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            label="Save Changes"
            icon="pi pi-save"
            onClick={saveConfig}
            loading={isSaving}
            className="flex-1"
            style={{
              borderColor: 'rgb(var(--color-muted))',
              color: 'rgb(var(--color-muted))',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          />
          <Button
            label="Reset"
            icon="pi pi-refresh"
            onClick={resetConfig}
            style={{
              borderColor: 'rgb(var(--color-muted))',
              color: 'rgb(var(--color-muted))',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          />
        </div>
        
        {/* Resize hint */}
        <div className="mt-4 p-3 bg-[rgb(var(--color-bg))]/50 border border-[rgb(var(--color-muted))]/20 rounded text-xs text-[rgb(var(--color-muted))]/70">
          <div className="flex items-center gap-2 mb-1">
            <span>↔️</span>
            <span className="font-medium">Resizable Panel</span>
          </div>
          <div>Drag the left edge to resize • Min: 300px • Max: 800px</div>
          {sidebarWidth !== 384 && (
            <div className="mt-1 text-[rgb(var(--color-primary))]/80">
              Current: {sidebarWidth}px (Default: 384px)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}