'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  usePublisher,
  insertMarkdown$,
} from '@mdxeditor/editor'
import { CardModal } from './CardModal'
import { DataTableModal } from './DataTableModal'

type ComponentType = 'tip' | 'note' | 'warning' | 'danger' | 'info' | 'card' | 'codeblock' | 'datatable'

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
      <i className="pi pi-lightbulb" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'note',
    label: 'Note',
    icon: (
      <i className="pi pi-pencil" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'warning',
    label: 'Warning',
    icon: (
      <i className="pi pi-exclamation-triangle" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'danger',
    label: 'Danger',
    icon: (
      <i className="pi pi-times-circle" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'info',
    label: 'Info',
    icon: (
      <i className="pi pi-info-circle" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'card',
    label: 'Card',
    icon: (
      <i className="pi pi-credit-card" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'codeblock',
    label: 'Code Block',
    icon: (
      <i className="pi pi-code" style={{ fontSize: '1rem' }}></i>
    )
  },
  {
    type: 'datatable',
    label: 'Data Table',
    icon: (
      <i className="pi pi-table" style={{ fontSize: '1rem' }}></i>
    )
  },
]

export const InsertComponentDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const [showCardModal, setShowCardModal] = useState(false)
  const [showDataTableModal, setShowDataTableModal] = useState(false)
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
    } else if (type === 'datatable') {
      // Show DataTable modal
      setShowDataTableModal(true)
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

  const handleDataTableInsert = (tableMarkdown: string) => {
    insertMarkdown(tableMarkdown + '\n\n')
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mdx-toolbar-button"
        aria-label="Insert Component"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Insert</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '2px !important' }}>
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

      <DataTableModal
        isOpen={showDataTableModal}
        onClose={() => setShowDataTableModal(false)}
        onInsert={handleDataTableInsert}
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
          <i className="pi pi-image" style={{ fontSize: '1.2rem' }}></i>
        )}
      </button>
    </>
  )
}
