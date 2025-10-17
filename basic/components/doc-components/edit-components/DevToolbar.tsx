'use client'

import React, { useState, useRef, useEffect } from 'react'

const DevToolbar: React.FC = () => {
  const [isTextStylesOpen, setIsTextStylesOpen] = useState(false)
  const [isListsOpen, setIsListsOpen] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [hasSelection, setHasSelection] = useState(false)
  const textStylesRef = useRef<HTMLDivElement>(null)
  const listsRef = useRef<HTMLDivElement>(null)

  // Debug: log when activeFormats changes
  useEffect(() => {
  }, [activeFormats])

  // En Next.js, process.env.NODE_ENV se evalúa en build time
  // En desarrollo siempre será 'development'
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Detectar formatos activos y si hay selección
  useEffect(() => {
    const updateActiveFormats = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setActiveFormats(new Set())
        setHasSelection(false)
        return
      }

      const range = selection.getRangeAt(0)

      // Verificar si hay texto seleccionado (no colapsado)
      setHasSelection(!range.collapsed)

      let node = range.commonAncestorContainer as HTMLElement
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement!
      }

      const formats = new Set<string>()
      const editableContainer = document.querySelector('[contenteditable="true"]')

      while (node && node !== editableContainer) {
        const tagName = node.tagName?.toLowerCase()
        if (tagName === 'strong' || tagName === 'b') formats.add('strong')
        if (tagName === 'em' || tagName === 'i') formats.add('em')
        if (tagName === 'u') formats.add('u')
        if (tagName === 'code') formats.add('code')
        node = node.parentElement!
      }

      setActiveFormats(formats)
    }

    document.addEventListener('selectionchange', updateActiveFormats)
    return () => document.removeEventListener('selectionchange', updateActiveFormats)
  }, [])

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

  // Cerrar dropdown de listas al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listsRef.current && !listsRef.current.contains(event.target as Node)) {
        setIsListsOpen(false)
      }
    }

    if (isListsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isListsOpen])

  const applyTextStyle = (tag: string) => {
    const article = document.getElementById('mdx-content')
    if (!article) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Si hay texto seleccionado
    if (!range.collapsed) {
      // Obtener el contenido seleccionado
      const selectedContent = range.cloneContents()

      // Verificar si la selección está dentro de un elemento de formato (h1-h6, p)
      let parentElement = range.commonAncestorContainer as HTMLElement
      if (parentElement.nodeType === Node.TEXT_NODE) {
        parentElement = parentElement.parentElement!
      }

      // Buscar el elemento de formato padre más cercano
      let formatElement = parentElement as HTMLElement | null
      while (formatElement && formatElement !== article) {
        if (/^(h[1-6]|p)$/i.test(formatElement.tagName || '')) {
          break
        }
        formatElement = formatElement.parentElement
      }

      // Si encontramos un elemento de formato, reemplazarlo
      if (formatElement && formatElement !== article && /^(h[1-6]|p)$/i.test(formatElement.tagName || '')) {
        // Crear el nuevo elemento con el contenido del elemento anterior
        const newElement = document.createElement(tag)
        newElement.innerHTML = formatElement.innerHTML

        // Reemplazar el elemento completo
        formatElement.replaceWith(newElement)

        // Colocar el cursor al final del nuevo elemento
        const newRange = document.createRange()
        newRange.selectNodeContents(newElement)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // Si no hay formato previo, crear nuevo elemento con la selección
        const newElement = document.createElement(tag)
        newElement.appendChild(selectedContent)

        range.deleteContents()
        range.insertNode(newElement)

        // Colocar cursor al final
        range.setStartAfter(newElement)
        range.setEndAfter(newElement)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    // Si NO hay texto seleccionado
    else {
      // Obtener el nodo actual
      let currentNode = range.startContainer as HTMLElement
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentElement!
      }

      // Buscar el elemento de línea actual (p, h1-h6)
      let lineElement = currentNode as HTMLElement | null
      while (lineElement && lineElement !== article) {
        if (/^(h[1-6]|p|div)$/i.test(lineElement.tagName || '')) {
          break
        }
        lineElement = lineElement.parentElement
      }

      // Si encontramos un elemento de línea, ir al final
      if (lineElement && lineElement !== article) {
        // Crear un nuevo elemento después de la línea actual
        const newElement = document.createElement(tag)
        newElement.textContent = tag === 'p' ? 'Normal text' : `Heading ${tag.substring(1)}`

        // Insertar 2 saltos de línea y el nuevo elemento
        const br1 = document.createElement('br')
        const br2 = document.createElement('br')

        lineElement.after(br2)
        lineElement.after(br1)
        br2.after(newElement)

        // Colocar cursor dentro del nuevo elemento
        const newRange = document.createRange()
        newRange.selectNodeContents(newElement)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // Fallback: insertar directamente
        const newElement = document.createElement(tag)
        newElement.textContent = tag === 'p' ? 'Normal text' : `Heading ${tag.substring(1)}`

        range.insertNode(document.createElement('br'))
        range.insertNode(document.createElement('br'))
        range.insertNode(newElement)

        const newRange = document.createRange()
        newRange.selectNodeContents(newElement)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    // Forzar el foco en el artículo
    article.focus()

    setIsTextStylesOpen(false)

    // Disparar evento personalizado para que EditableArticle guarde
    // Usar setTimeout para asegurar que el cursor se posicione primero
    setTimeout(() => {
      const saveEvent = new CustomEvent('devtoolbar:save')
      document.dispatchEvent(saveEvent)
    }, 0)
  }

  const applyInlineStyle = (tag: 'strong' | 'em' | 'u' | 'code') => {
    const editableContainer = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editableContainer) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Solo funciona si hay texto seleccionado
    if (range.collapsed) return

    // Verificar si el texto seleccionado ya tiene este formato
    let parentElement = range.commonAncestorContainer as HTMLElement
    if (parentElement.nodeType === Node.TEXT_NODE) {
      parentElement = parentElement.parentElement!
    }

    // Buscar si ya existe el formato
    let formatElement = parentElement as HTMLElement | null
    while (formatElement && formatElement !== editableContainer) {
      if (formatElement.tagName?.toLowerCase() === tag) {
        // Ya tiene el formato, removerlo (toggle off)
        const textContent = formatElement.textContent || ''
        const textNode = document.createTextNode(textContent)
        formatElement.replaceWith(textNode)

        // Seleccionar el texto
        const newRange = document.createRange()
        newRange.selectNodeContents(textNode)
        selection.removeAllRanges()
        selection.addRange(newRange)

        // Guardar cambios - usar setTimeout para asegurar que el cursor se posicione primero
        setTimeout(() => {
          const saveEvent = new CustomEvent('devtoolbar:save')
          document.dispatchEvent(saveEvent)
        }, 0)
        return
      }
      formatElement = formatElement.parentElement
    }

    // No tiene el formato, aplicarlo
    const newElement = document.createElement(tag)
    const extractedContent = range.extractContents()
    newElement.appendChild(extractedContent)

    range.insertNode(newElement)

    // Colocar cursor al FINAL del nuevo elemento (collapsed)
    const newRange = document.createRange()
    newRange.selectNodeContents(newElement)
    newRange.collapse(false) // false = colapsar al final
    selection.removeAllRanges()
    selection.addRange(newRange)

    // Forzar foco
    editableContainer.focus()

    // Guardar cambios - usar setTimeout para asegurar que el cursor se posicione primero
    setTimeout(() => {
      const saveEvent = new CustomEvent('devtoolbar:save')
      document.dispatchEvent(saveEvent)
    }, 0)
  }

  const applyListStyle = (listType: 'ul' | 'ol') => {
    const article = document.getElementById('mdx-content')
    if (!article) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Obtener el nodo actual
    let currentNode = range.startContainer as HTMLElement
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement!
    }

    // Buscar el elemento de línea actual (p, h1-h6)
    let lineElement = currentNode as HTMLElement | null
    while (lineElement && lineElement !== article) {
      if (/^(h[1-6]|p|div|li)$/i.test(lineElement.tagName || '')) {
        break
      }
      lineElement = lineElement.parentElement
    }

    // Si encontramos un elemento de línea, crear la lista
    if (lineElement && lineElement !== article) {
      // Crear la lista
      const listElement = document.createElement(listType)

      // Crear el primer item de la lista con texto por defecto
      const listItem = document.createElement('li')
      listItem.textContent = 'List item'

      listElement.appendChild(listItem)

      // Insertar después del elemento actual
      lineElement.after(document.createElement('br'))
      lineElement.after(listElement)

      // Colocar cursor dentro del list item
      const newRange = document.createRange()
      newRange.selectNodeContents(listItem)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
    } else {
      // Fallback: insertar directamente
      const listElement = document.createElement(listType)
      const listItem = document.createElement('li')
      listItem.textContent = 'List item'
      listElement.appendChild(listItem)

      range.insertNode(document.createElement('br'))
      range.insertNode(listElement)

      const newRange = document.createRange()
      newRange.selectNodeContents(listItem)
      newRange.collapse(false)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }

    // Forzar el foco en el artículo
    article.focus()

    setIsListsOpen(false)

    // Disparar evento personalizado para que EditableArticle guarde
    setTimeout(() => {
      const saveEvent = new CustomEvent('devtoolbar:save')
      document.dispatchEvent(saveEvent)
    }, 0)
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
            className={`dev-toolbar-button ${activeFormats.has('strong') ? 'dev-toolbar-button-active' : ''}`}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
            disabled={!hasSelection}
            onClick={() => applyInlineStyle('strong')}
          >
            <span className="dev-toolbar-icon font-bold">B</span>
          </button>

          <button
            className={`dev-toolbar-button ${activeFormats.has('em') ? 'dev-toolbar-button-active' : ''}`}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
            disabled={!hasSelection}
            onClick={() => applyInlineStyle('em')}
          >
            <span className="dev-toolbar-icon italic">I</span>
          </button>

          <button
            className={`dev-toolbar-button ${activeFormats.has('u') ? 'dev-toolbar-button-active' : ''}`}
            title="Underline"
            aria-label="Underline"
            disabled={!hasSelection}
            onClick={() => applyInlineStyle('u')}
          >
            <span className="dev-toolbar-icon underline">U</span>
          </button>

          <button
            className={`dev-toolbar-button ${activeFormats.has('code') ? 'dev-toolbar-button-active' : ''}`}
            title="Code"
            aria-label="Code"
            disabled={!hasSelection}
            onClick={() => applyInlineStyle('code')}
          >
            <span className="dev-toolbar-icon font-mono text-sm">{'</>'}</span>
          </button>
        </div>

        <div className="dev-toolbar-divider" />

        <div className="dev-toolbar-group" ref={listsRef}>
          <button
            className="dev-toolbar-button"
            title="Lists"
            aria-label="Lists"
            onClick={() => setIsListsOpen(!isListsOpen)}
          >
            <svg className="dev-toolbar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3.5H3V4.5H2V3.5Z" fill="currentColor"/>
              <path d="M2 7.5H3V8.5H2V7.5Z" fill="currentColor"/>
              <path d="M2 11.5H3V12.5H2V11.5Z" fill="currentColor"/>
              <path d="M5 4H14V4.5H5V4Z" fill="currentColor"/>
              <path d="M5 8H14V8.5H5V8Z" fill="currentColor"/>
              <path d="M5 12H14V12.5H5V12Z" fill="currentColor"/>
            </svg>
            <svg className="ml-1" width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 2L4 5L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {isListsOpen && (
            <div className="dev-toolbar-dropdown">
              <button
                className="dev-toolbar-dropdown-item"
                onClick={() => applyListStyle('ul')}
              >
                <svg className="inline-block mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                  <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
                  <path d="M6 4H14M6 8H14M6 12H14" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span>Bullet List</span>
              </button>
              <button
                className="dev-toolbar-dropdown-item"
                onClick={() => applyListStyle('ol')}
              >
                <svg className="inline-block mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="1" y="5" fontSize="4" fill="currentColor">1.</text>
                  <text x="1" y="9" fontSize="4" fill="currentColor">2.</text>
                  <text x="1" y="13" fontSize="4" fill="currentColor">3.</text>
                  <path d="M6 4H14M6 8H14M6 12H14" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span>Numbered List</span>
              </button>
            </div>
          )}
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
