'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  usePublisher,
  insertMarkdown$,
} from '@mdxeditor/editor'

type ComponentType = 'tip' | 'note' | 'warning' | 'danger' | 'info' | 'codeblock'

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
    } else {
      // Insert JSX component as markdown (Info, Tip, Warning, Danger, Note)
      const componentName = type.charAt(0).toUpperCase() + type.slice(1)
      const jsxMarkdown = '<' + componentName + '>\n\n</' + componentName + '>\n\n'
      insertMarkdown(jsxMarkdown)
    }
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mdx-toolbar-button"
        title="Insert Component"
        aria-label="Insert Component"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '2px' }}>
          <polyline points="6 9 12 15 18 9"/>
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
    </div>
  )
}
