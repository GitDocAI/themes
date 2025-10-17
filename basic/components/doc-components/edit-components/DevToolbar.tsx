'use client'

import React, { useState, useRef, useEffect } from 'react'

const DevToolbar: React.FC = () => {
  const [isTextStylesOpen, setIsTextStylesOpen] = useState(false)
  const textStylesRef = useRef<HTMLDivElement>(null)

  // En Next.js, process.env.NODE_ENV se evalúa en build time
  // En desarrollo siempre será 'development'
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textStylesRef.current && !textStylesRef.current.contains(event.target as Node)) {
        setIsTextStylesOpen(false)
      }
    }

    if (isTextStylesOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTextStylesOpen])

  const applyTextStyle = (tag: string) => {
    const article = document.getElementById('mdx-content')
    if (!article) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Crear el nuevo elemento
    const newElement = document.createElement(tag)

    // Si hay texto seleccionado, usarlo como contenido
    if (!range.collapsed) {
      newElement.appendChild(range.extractContents())
    } else {
      // Si no hay selección, insertar placeholder
      newElement.textContent = tag === 'p' ? 'Normal text' : `Heading ${tag.substring(1)}`
    }

    // Insertar el nuevo elemento
    range.insertNode(newElement)

    // Colocar el cursor al final del nuevo elemento
    range.setStartAfter(newElement)
    range.setEndAfter(newElement)
    selection.removeAllRanges()
    selection.addRange(range)

    // Forzar el foco en el artículo
    article.focus()

    setIsTextStylesOpen(false)
  }

  return (
    <div className="dev-toolbar">
      <div className="dev-toolbar-container">
        <div className="dev-toolbar-group" ref={textStylesRef}>
          <button
            className="dev-toolbar-button"
            title="Text Styles"
            aria-label="Text Styles"
            onClick={() => setIsTextStylesOpen(!isTextStylesOpen)}
          >
            <span className="dev-toolbar-icon">Tt</span>
            <svg className="ml-1" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 2L4 5L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {isTextStylesOpen && (
            <div className="dev-toolbar-dropdown">
              <button
                className="dev-toolbar-dropdown-item"
                onClick={() => applyTextStyle('p')}
              >
                <span>Normal text</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-3xl font-bold"
                onClick={() => applyTextStyle('h1')}
              >
                <span>Heading 1</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-2xl font-bold"
                onClick={() => applyTextStyle('h2')}
              >
                <span>Heading 2</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-xl font-bold"
                onClick={() => applyTextStyle('h3')}
              >
                <span>Heading 3</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-lg font-bold"
                onClick={() => applyTextStyle('h4')}
              >
                <span>Heading 4</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-base font-bold"
                onClick={() => applyTextStyle('h5')}
              >
                <span>Heading 5</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item text-sm font-bold"
                onClick={() => applyTextStyle('h6')}
              >
                <span>Heading 6</span>
              </button>
            </div>
          )}
        </div>

        <div className="dev-toolbar-divider" />

        <div className="dev-toolbar-group">
          <button
            className="dev-toolbar-button"
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <span className="dev-toolbar-icon font-bold">B</span>
          </button>

          <button
            className="dev-toolbar-button"
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <span className="dev-toolbar-icon italic">I</span>
          </button>

          <button
            className="dev-toolbar-button"
            title="Underline"
            aria-label="Underline"
          >
            <span className="dev-toolbar-icon underline">U</span>
          </button>

          <button
            className="dev-toolbar-button"
            title="Code"
            aria-label="Code"
          >
            <span className="dev-toolbar-icon font-mono text-sm">{'</>'}</span>
          </button>
        </div>

        <div className="dev-toolbar-divider" />

        <div className="dev-toolbar-group">
          <button
            className="dev-toolbar-button"
            title="Lists"
            aria-label="Lists"
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3.5H3V4.5H2V3.5Z" fill="currentColor"/>
              <path d="M2 7.5H3V8.5H2V7.5Z" fill="currentColor"/>
              <path d="M2 11.5H3V12.5H2V11.5Z" fill="currentColor"/>
              <path d="M5 4H14V4.5H5V4Z" fill="currentColor"/>
              <path d="M5 8H14V8.5H5V8Z" fill="currentColor"/>
              <path d="M5 12H14V12.5H5V12Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="dev-toolbar-divider" />

        <div className="dev-toolbar-group">
          <button
            className="dev-toolbar-button"
            title="Images"
            aria-label="Images"
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor"/>
              <path d="M2 11L5 8L7 10L11 6L14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V11Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            className="dev-toolbar-button"
            title="Links"
            aria-label="Links"
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 10.5L5.5 12.5C4.67157 13.3284 3.32843 13.3284 2.5 12.5C1.67157 11.6716 1.67157 10.3284 2.5 9.5L4.5 7.5M11.5 8.5L13.5 6.5C14.3284 5.67157 14.3284 4.32843 13.5 3.5C12.6716 2.67157 11.3284 2.67157 10.5 3.5L8.5 5.5M6 10L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            className="dev-toolbar-button"
            title="Table"
            aria-label="Table"
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
              <path d="M2 6H14M6 6V14" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </div>

        <div className="dev-toolbar-divider" />

        <div className="dev-toolbar-group">
          <button
            className="dev-toolbar-button"
            title="Insert Elements"
            aria-label="Insert Elements"
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="ml-1 text-xs">Insert</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DevToolbar
