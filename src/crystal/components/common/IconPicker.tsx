import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as solidIcons from '@heroicons/react/24/solid'
import * as outlineIcons from '@heroicons/react/24/outline'
import { allIcons, type Icon, type IconLibrary } from '../editor/node-views/icon-data'

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconKey: string) => void;
  onRemoveIcon: () => void;
  showPicker: boolean;
  onClosePicker: () => void;
  pickerPosition: { top: number; left: number };
  theme: 'light' | 'dark';
  iconColor: string;
}

// Helper to render icons from different libraries
const IconRenderer = ({ iconKey, ...props }: { iconKey: string;[key: string]: any }) => {
  if (!iconKey) return null

  if (iconKey.startsWith('pi ')) {
    return <i className={iconKey} {...props}></i>
  }
  if (iconKey.startsWith('fa ')) {
    return <i className={iconKey} {...props}></i>
  }
  if (iconKey.startsWith('mi-')) {
    const iconName = iconKey.substring(3)
    return <span className="material-icons" {...props}>{iconName}</span>
  }
  if (iconKey.startsWith('hi-')) {
    const keyParts = iconKey.substring(3).split('-')
    const type = keyParts.pop()
    const name = keyParts.join('-')
    
    const componentName = name.charAt(0).toUpperCase() + name.slice(1) + 'Icon'
    
    const iconLib = type === 'solid' ? solidIcons : outlineIcons
    const IconComponent = (iconLib as any)[componentName]

    if (IconComponent) {
      return <IconComponent {...props} />
    }
  }
  return <i className={iconKey} {...props}></i> // Fallback for old format
}

// Helper to get the library name
const getLibraryName = (library: IconLibrary) => {
  switch (library) {
    case 'fa': return 'Font Awesome'
    case 'hi-outline': return 'Heroicons (Outline)'
    case 'hi-solid': return 'Heroicons (Solid)'
    case 'mi': return 'Material Icons'
    case 'pi': return 'Prime Icons'
  }
}

export const IconPicker = ({
  selectedIcon,
  onSelectIcon,
  onRemoveIcon,
  showPicker,
  onClosePicker,
  pickerPosition,
  theme,
  iconColor,
}: IconPickerProps) => {
  const inlineIconPickerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIcons = searchQuery
    ? allIcons.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    : allIcons

  // Close inline icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inlineIconPickerRef.current && !inlineIconPickerRef.current.contains(event.target as Node)) {
        onClosePicker()
        setSearchQuery('')
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker, onClosePicker])

  const handleSelectIcon = (iconKey: string) => {
    onSelectIcon(iconKey)
    setSearchQuery('')
  }

  const groupedIcons = filteredIcons.reduce((acc, icon) => {
    if (!acc[icon.library]) {
      acc[icon.library] = []
    }
    acc[icon.library].push(icon)
    return acc
  }, {} as Record<IconLibrary, Icon[]>)

  if (!showPicker) return null

  return createPortal(
    <div
      ref={inlineIconPickerRef}
      style={{
        position: 'absolute',
        top: pickerPosition.top,
        left: pickerPosition.left,
        zIndex: 10000,
        backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
        border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Search for icons..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
          borderRadius: '6px',
          backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
          color: theme === 'light' ? '#111827' : '#f3f4f6',
          boxSizing: 'border-box'
        }}
      />
      {selectedIcon && (
        <button
          type="button"
          onClick={() => {
            onRemoveIcon()
            onClosePicker()
          }}
          style={{
            width: '100%', padding: '8px',
            backgroundColor: theme === 'light' ? '#fef2f2' : '#450a0a',
            border: `1px solid ${theme === 'light' ? '#fecaca' : '#7f1d1d'}`,
            borderRadius: '6px', color: theme === 'light' ? '#dc2626' : '#fca5a5',
            cursor: 'pointer', fontSize: '12px', fontWeight: '500', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <i className="pi pi-trash" style={{ fontSize: '12px' }}></i>
          Remove Icon
        </button>
      )}
      <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
        {Object.entries(groupedIcons).map(([library, icons]) => (
          <div key={library} style={{ marginBottom: '10px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '600', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
              {getLibraryName(library as IconLibrary)}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {(icons as Icon[]).map(({ key, name }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectIcon(key)}
                  style={{
                    padding: '8px',
                    backgroundColor: selectedIcon === key ? iconColor : (theme === 'light' ? '#f3f4f6' : '#374151'),
                    border: selectedIcon === key ? `2px solid ${iconColor}` : `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={name}
                >
                  <IconRenderer iconKey={key} style={{
                    fontSize: '18px',
                    color: selectedIcon === key ? '#ffffff' : (theme === 'light' ? '#111827' : '#f3f4f6'),
                    width: '20px',
                    height: '20px'
                  }} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredIcons.length === 0 && (
          <div style={{ textAlign: 'center', color: theme === 'light' ? '#6b7280' : '#9ca3af', padding: '20px' }}>
            No icons found.
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
