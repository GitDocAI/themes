'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  usePublisher,
  insertMarkdown$,
} from '@mdxeditor/editor'
import { CardModal } from './CardModal'

type ComponentType = 'tip' | 'note' | 'warning' | 'danger' | 'info' | 'card' | 'codeblock'

interface ComponentOption {
  type: ComponentType
  label: string
  icon: React.ReactNode
}

const componentOptions: ComponentOption[] = [
  {
    type: 'tip',
    label: 'Tip',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6M10 22h4M15 2a4 4 0 0 1 0 8H9a4 4 0 0 1 0-8h6z"/>
        <path d="M9 10v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6"/>
      </svg>
    )
  },
  {
    type: 'note',
    label: 'Note',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )
  },
  {
    type: 'warning',
    label: 'Warning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  },
  {
    type: 'danger',
    label: 'Danger',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  },
  {
    type: 'info',
    label: 'Info',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    )
  },
  {
    type: 'card',
    label: 'Card',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
      </svg>
    )
  },
  {
    type: 'codeblock',
    label: 'Code Block',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    )
  },
]

export const InsertComponentDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [showCardModal, setShowCardModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const insertMarkdown = usePublisher(insertMarkdown$)

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

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: `${buttonRect.bottom + 4}px`,
        left: `${buttonRect.left}px`,
      })
    }
  }, [isOpen])

  const handleInsert = (type: ComponentType) => {
    if (type === 'codeblock') {
      // Insert code block as markdown - the codeBlockPlugin will parse and render it
      const codeBlockMarkdown = '```js\n\n```\n\n'
      insertMarkdown(codeBlockMarkdown)
      setIsOpen(false)
    } else if (type === 'card') {
      // Show Card modal
      setShowCardModal(true)
      setIsOpen(false)
    } else {
      // Insert JSX component as markdown (Info, Tip, Warning, Danger, Note)
      const componentName = type.charAt(0).toUpperCase() + type.slice(1)
      const jsxMarkdown = '<' + componentName + '>\n\n</' + componentName + '>\n\n'
      insertMarkdown(jsxMarkdown)
      setIsOpen(false)
    }
  }

  const handleCardInsert = (cardMarkdown: string) => {
    insertMarkdown(cardMarkdown + '\n\n')
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mdx-toolbar-button"
        data-tooltip="Insert Component"
        aria-label="Insert Component"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
          <path d="M7 7h.01"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px', strokeWidth: '2px !important' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div
          className="component-dropdown-menu"
          style={dropdownStyle}
          role="menu"
        >
          {componentOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleInsert(option.type)}
              className="component-dropdown-item"
              role="menuitem"
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      <CardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onInsert={handleCardInsert}
      />
    </div>
  )
}

// Image Upload Button Component
interface ImageUploadButtonProps {
  webhookUrl: string
  authentication: string
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ webhookUrl, authentication }) => {
  const insertMarkdown = usePublisher(insertMarkdown$)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setIsUploading(true)

    try {
      // Create FormData with the image
      const formData = new FormData()

      // Generate filename based on current path and timestamp
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()
      const filename = `screenshot_${timestamp}.${extension}`
      // Only send assets/filename, not the full path
      const assetPath = `assets/${filename}`

      // Server expects 'binary_content' as the field name for the file
      formData.append('binary_content', file, filename)
      formData.append('file_path', assetPath)

      console.log('Uploading image:', {
        filename,
        assetPath,
        webhookUrl,
        hasAuth: !!authentication,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? `File(${value.name})` : value
        }))
      })

      // Upload to webhook
      // IMPORTANT: Do NOT set Content-Type header - browser sets it automatically with boundary
      console.log('About to send request:', {
        url: webhookUrl,
        method: 'POST',
        hasFormData: formData instanceof FormData,
        formDataSize: Array.from(formData.entries()).length
      })

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        // Do NOT include headers at all to let browser handle Content-Type
        ...(authentication && {
          headers: {
            'Authorization': authentication
          }
        })
      })

      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        requestContentType: 'auto-generated by browser for FormData'
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          contentType: response.headers.get('content-type')
        })
        throw new Error(`Failed to upload image: ${response.status} ${errorText}`)
      }

      // Insert image markdown into editor
      const relativePath = `./assets/${filename}`
      const imageMarkdown = `<img\n  src="${relativePath}"\n  alt="Image description"\n/>\n\n`
      insertMarkdown(imageMarkdown)

    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to upload image: ${errorMessage}\n\nCheck the console for more details.`)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mdx-toolbar-button"
        data-tooltip="Insert Image"
        aria-label="Insert Image"
        disabled={isUploading}
        style={{ position: 'relative' }}
      >
        {isUploading ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" style={{ strokeWidth: '2px !important' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        )}
      </button>
    </>
  )
}
