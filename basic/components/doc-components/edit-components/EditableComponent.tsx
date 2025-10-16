'use client'

import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {components} from '../../../shared/mdx_components/components'
import TiptapEditor from './TipTapEditor' // Import TiptapEditor

interface Props {
  original_content?: string
  webhook_url: string
  authentication?: string
}

export const EditableComponent = ({
  original_content = '',
  webhook_url,
  authentication,
}: Props) => {
  const pathname = usePathname()
  const [filePath] = useState(() => pathname + '.mdx')
  const [markdown, setMarkdown] = useState(original_content)

  const editableRef = useRef<HTMLDivElement>(null)
  const markdownRef = useRef(original_content)
  const prevContentRef = useRef(original_content)
  const isUpdatingRef = useRef(false)

  const saveToWebhook = async (old_segment: string, new_text: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (authentication) headers['Authorization'] = `${authentication}`

      const res = await fetch(webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          file_path: filePath,
          old_segment,
          new_text,
        }),
      })

      const data = await res.json().catch(() => {
        throw new Error('Error saving')
      })

      if (!res.ok || !data.success) throw new Error(data.error || 'Error saving')
      prevContentRef.current = new_text
    } catch (err) {
      console.log(err)
    }
  }

  // Obtiene la posición del cursor en el texto renderizado
  const getCursorPosition = (): number => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !editableRef.current) return 0

    const range = sel.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editableRef.current)
    preCaretRange.setEnd(range.endContainer, range.endOffset)

    return preCaretRange.toString().length
  }

  // Restaura la posición del cursor en el texto renderizado
  const setCursorPosition = (pos: number) => {
    if (!editableRef.current) return

    const walker = document.createTreeWalker(
      editableRef.current,
      NodeFilter.SHOW_TEXT,
      null
    )

    let currentPos = 0
    let node: Node | null = null

    while ((node = walker.nextNode())) {
      const length = node.textContent?.length || 0
      if (currentPos + length >= pos) {
        const range = document.createRange()
        const sel = window.getSelection()
        const offset = Math.min(pos - currentPos, length)

        try {
          range.setStart(node, offset)
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        } catch (e) {
          console.error('Error setting cursor:', e)
        }
        return
      }
      currentPos += length
    }

    // Si no encontramos la posición, coloca al final
    try {
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(editableRef.current)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    } catch (e) {
      console.error('Error setting cursor at end:', e)
    }
  }

  // Mapea posición del cursor en texto renderizado a posición en markdown
  const mapRenderedToMarkdown = (renderedPos: number): number => {
    const rendered = editableRef.current?.textContent || ''
    const md = markdownRef.current

    // Contar cuántos caracteres markdown corresponden a la posición renderizada
    let mdPos = 0
    let renderPos = 0

    while (mdPos < md.length && renderPos < renderedPos) {
      const char = md[mdPos]

      // Caracteres markdown que no se renderizan
      if (char === '#' || char === '*' || char === '_' || char === '`' ||
          char === '[' || char === ']' || char === '(' || char === ')' ||
          char === '>' || char === '-' && md[mdPos + 1] === ' ') {
        mdPos++
        continue
      }

      renderPos++
      mdPos++
    }

    return mdPos
  }

  // Mapea posición en markdown a posición en texto renderizado
  const mapMarkdownToRendered = (mdPos: number): number => {
    const md = markdownRef.current
    let renderPos = 0

    for (let i = 0; i < mdPos && i < md.length; i++) {
      const char = md[i]

      // Caracteres markdown que no se renderizan (simplificado)
      if (char === '#' || char === '*' || char === '_' || char === '`' ||
          char === '[' || char === ']' || char === '(' || char === ')' ||
          char === '>') {
        continue
      }

      renderPos++
    }

    return renderPos
  }

  const updateMarkdown = (newMd: string) => {
    if (isUpdatingRef.current) return

    const cursorPos = getCursorPosition()
    markdownRef.current = newMd
    console.log(newMd)

    isUpdatingRef.current = true
    setMarkdown(newMd)

    requestAnimationFrame(() => {
      setCursorPosition(cursorPos)
      isUpdatingRef.current = false
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isUpdatingRef.current) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const cursorPos = getCursorPosition()
    const mdPos = mapRenderedToMarkdown(cursorPos)
    const currentMd = markdownRef.current

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault()

      if (sel.toString().length > 0) {
        // Hay texto seleccionado
        const start = getCursorPosition() - sel.toString().length
        const end = getCursorPosition()
        const mdStart = mapRenderedToMarkdown(start)
        const mdEnd = mapRenderedToMarkdown(end)

        const newMd = currentMd.slice(0, mdStart) + currentMd.slice(mdEnd)
        updateMarkdown(newMd)
      } else if (mdPos > 0) {
        // Borrar un caracter
        const newMd = currentMd.slice(0, mdPos - 1) + currentMd.slice(mdPos)
        updateMarkdown(newMd)
      }
      return
    }

    // Delete
    if (e.key === 'Delete') {
      e.preventDefault()

      if (sel.toString().length > 0) {
        const start = getCursorPosition() - sel.toString().length
        const end = getCursorPosition()
        const mdStart = mapRenderedToMarkdown(start)
        const mdEnd = mapRenderedToMarkdown(end)

        const newMd = currentMd.slice(0, mdStart) + currentMd.slice(mdEnd)
        updateMarkdown(newMd)
      } else if (mdPos < currentMd.length) {
        const newMd = currentMd.slice(0, mdPos) + currentMd.slice(mdPos + 1)
        updateMarkdown(newMd)
      }
      return
    }

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault()
      const newMd = currentMd.slice(0, mdPos) + '\n' + currentMd.slice(mdPos)
      updateMarkdown(newMd)
      return
    }

    // Caracteres imprimibles
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()

      if (sel.toString().length > 0) {
        // Reemplazar selección
        const start = getCursorPosition() - sel.toString().length
        const end = getCursorPosition()
        const mdStart = mapRenderedToMarkdown(start)
        const mdEnd = mapRenderedToMarkdown(end)

        const newMd = currentMd.slice(0, mdStart) + e.key + currentMd.slice(mdEnd)
        updateMarkdown(newMd)
      } else {
        // Insertar caracter
        const newMd = currentMd.slice(0, mdPos) + e.key + currentMd.slice(mdPos)
        updateMarkdown(newMd)
      }
      return
    }
  }

  const handleBlur = () => {
    const currentMarkdown = markdownRef.current
    if (currentMarkdown !== prevContentRef.current) {
      saveToWebhook(prevContentRef.current, currentMarkdown)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const cursorPos = getCursorPosition()
    const mdPos = mapRenderedToMarkdown(cursorPos)
    const currentMd = markdownRef.current

    if (sel.toString().length > 0) {
      const start = getCursorPosition() - sel.toString().length
      const mdStart = mapRenderedToMarkdown(start)
      const newMd = currentMd.slice(0, mdStart) + text + currentMd.slice(mdPos)
      updateMarkdown(newMd)
    } else {
      const newMd = currentMd.slice(0, mdPos) + text + currentMd.slice(mdPos)
      updateMarkdown(newMd)
    }
  }

  return (
    <div className="relative">
      <TiptapEditor
              content={markdown}
              onChange={updateMarkdown}
              onBlur={handleBlur}
            />
    </div>
  )
}
