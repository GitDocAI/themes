'use client'

import React, { useRef, useEffect } from 'react'

interface EditableContentProps {
  children: React.ReactNode
  originalMarkdown: string
  webhook_url: string
  authentication: string
  file_path: string
}

/**
 * Convierte el contenido HTML del contentEditable a Markdown
 */
function htmlToMarkdown(element: HTMLElement): string {
  let markdown = ''

  const processNode = (node: Node): string => {
    // Nodo de texto
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    // Nodo de elemento
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const children = Array.from(el.childNodes).map(processNode).join('')

      // Procesar según el tipo de elemento
      switch (el.tagName.toLowerCase()) {
        case 'h1':
          return `# ${children}\n\n`
        case 'h2':
          return `## ${children}\n\n`
        case 'h3':
          return `### ${children}\n\n`
        case 'h4':
          return `#### ${children}\n\n`
        case 'h5':
          return `##### ${children}\n\n`
        case 'h6':
          return `###### ${children}\n\n`

        case 'p':
          return `${children}\n\n`

        case 'strong':
        case 'b':
          return `**${children}**`

        case 'em':
        case 'i':
          return `*${children}*`

        case 'del':
        case 's':
          return `~~${children}~~`

        case 'code':
          // Si es código inline (no dentro de pre)
          if (!el.closest('pre')) {
            return `\`${children}\``
          }
          return children

        case 'pre':
          const code = el.querySelector('code')
          if (code) {
            const language = code.className.match(/language-(\w+)/)?.[1] || ''
            return `\`\`\`${language}\n${code.textContent || ''}\n\`\`\`\n\n`
          }
          return `\`\`\`\n${children}\n\`\`\`\n\n`

        case 'ul':
          return processListItems(el, '-') + '\n'

        case 'ol':
          return processListItems(el, '1.') + '\n'

        case 'li':
          // Los items de lista se manejan en ul/ol
          return children

        case 'blockquote':
          return children.split('\n').map(line => line ? `> ${line}` : '').join('\n') + '\n\n'

        case 'a':
          const href = el.getAttribute('href') || ''
          return `[${children}](${href})`

        case 'img':
          const src = el.getAttribute('src') || ''
          const alt = el.getAttribute('alt') || ''
          return `![${alt}](${src})\n\n`

        case 'br':
          return '\n'

        case 'hr':
          return '---\n\n'

        // Divs y spans - solo retornar contenido
        case 'div':
        case 'span':
        case 'article':
        case 'section':
          return children

        default:
          // Para elementos desconocidos, retornar el contenido
          return children
      }
    }

    return ''
  }

  const processListItems = (list: HTMLElement, marker: string): string => {
    const items = Array.from(list.children).filter(child => child.tagName.toLowerCase() === 'li')
    return items.map((item, index) => {
      const text = extractTextFromElement(item as HTMLElement)
      const actualMarker = marker === '1.' ? `${index + 1}.` : marker
      return `${actualMarker} ${text}`
    }).join('\n')
  }

  const extractTextFromElement = (el: HTMLElement): string => {
    let text = ''
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node as HTMLElement
        switch (child.tagName.toLowerCase()) {
          case 'strong':
          case 'b':
            text += `**${child.textContent}**`
            break
          case 'em':
          case 'i':
            text += `*${child.textContent}*`
            break
          case 'code':
            text += `\`${child.textContent}\``
            break
          default:
            text += child.textContent
        }
      }
    })
    return text.trim()
  }

  markdown = processNode(element)

  // Limpiar múltiples líneas en blanco consecutivas
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  return markdown.trim()
}

export function EditableContent({ children, originalMarkdown, webhook_url, authentication, file_path }: EditableContentProps) {
  const childRef = useRef<HTMLElement | null>(null)
  const originalMarkdownRef = useRef(originalMarkdown)

  useEffect(() => {
    originalMarkdownRef.current = originalMarkdown
  }, [originalMarkdown])

  const sendToWebhook = async (oldContent: string, newContent: string) => {
    if (!webhook_url) {
      console.warn('No webhook URL configured')
      return
    }

    try {
      const res = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authentication && { 'Authorization': authentication })
        },
        body: JSON.stringify({
          file_path: file_path,
          old_segment: oldContent,
          new_text: newContent,
        }),
      })

      if (!res.ok) {
        console.error('Failed to save content:', await res.text())
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  // Callback ref para obtener el elemento hijo
  const setChildRef = (element: HTMLElement | null) => {
    // Cleanup del elemento anterior
    if (childRef.current) {
      childRef.current.removeAttribute('contentEditable')
      childRef.current.classList.remove('editable-content', 'editing')
      childRef.current.style.outline = ''
      childRef.current.style.cursor = ''
    }

    if (!element) return
    childRef.current = element

    const handleBlur = () => {
      if (!childRef.current) return

      // Convertir HTML a Markdown
      const newMarkdown = htmlToMarkdown(childRef.current)

      // Solo guardar si cambió
      if (newMarkdown !== originalMarkdownRef.current) {
        sendToWebhook(originalMarkdownRef.current, newMarkdown)
        originalMarkdownRef.current = newMarkdown
      }

      childRef.current.classList.remove('editing')
    }

    const handleFocus = () => {
      if (!childRef.current) return
      childRef.current.classList.add('editing')
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Backspace o Delete: Si el componente está vacío, eliminarlo y mover al anterior
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!childRef.current) return

        const isEmpty = childRef.current.textContent?.trim() === '' ||
                       childRef.current.innerHTML === '<br>' ||
                       childRef.current.innerHTML === ''

        if (isEmpty) {
          e.preventDefault()

          const parent = childRef.current.parentElement

          // Contar cuántos hermanos editables hay
          const editableSiblings = parent ?
            Array.from(parent.children).filter(el =>
              el.getAttribute('contentEditable') === 'true'
            ) : []

          // Si es el único elemento editable, no eliminarlo
          if (editableSiblings.length <= 1) {
            return
          }

          const previousSibling = childRef.current.previousElementSibling as HTMLElement | null

          if (previousSibling && parent) {
            // Eliminar el elemento actual
            childRef.current.remove()

            // Buscar el elemento editable anterior
            let targetElement = previousSibling
            while (targetElement && targetElement.getAttribute('contentEditable') !== 'true') {
              targetElement = targetElement.previousElementSibling as HTMLElement | null
            }

            // Enfocar el elemento anterior si existe y es editable
            if (targetElement && targetElement.getAttribute('contentEditable') === 'true') {
              targetElement.focus()

              // Colocar el cursor al final del elemento anterior
              const range = document.createRange()
              const sel = window.getSelection()
              range.selectNodeContents(targetElement)
              range.collapse(false) // false = al final
              sel?.removeAllRanges()
              sel?.addRange(range)
            }
          }
          return
        }
      }

      // Enter: guardar, cerrar edición y crear nuevo elemento
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()

        if (!childRef.current) return

        // Guardar el elemento actual
        const newMarkdown = htmlToMarkdown(childRef.current)
        if (newMarkdown !== originalMarkdownRef.current) {
          sendToWebhook(originalMarkdownRef.current, newMarkdown)
          originalMarkdownRef.current = newMarkdown
        }

        // Crear nuevo elemento del mismo tipo después del actual
        const tagName = childRef.current.tagName.toLowerCase()
        const parent = childRef.current.parentElement

        if (parent) {
          let newElement: HTMLElement | null = null

          // Crear elemento según el tipo
          if (tagName === 'p') {
            newElement = document.createElement('p')
            newElement.className = childRef.current.className
            newElement.innerHTML = '<br>' // Placeholder
          } else if (tagName === 'li') {
            newElement = document.createElement('li')
            newElement.className = childRef.current.className
            newElement.innerHTML = '<br>'
          } else if (tagName.match(/^h[1-6]$/)) {
            newElement = document.createElement(tagName)
            newElement.className = childRef.current.className
            newElement.innerHTML = '<br>'
          }

          if (newElement) {
            // Buscar el siguiente hermano del wrapper del componente actual
            // Para evitar crear múltiples elementos dentro del mismo wrapper
            let nextSibling = childRef.current.nextSibling

            // Insertar después del elemento actual
            if (nextSibling) {
              parent.insertBefore(newElement, nextSibling)
            } else {
              parent.appendChild(newElement)
            }

            // Hacer el nuevo elemento editable y enfocarlo
            newElement.setAttribute('contentEditable', 'true')
            newElement.classList.add('editable-content')
            newElement.style.outline = 'none'
            newElement.style.cursor = 'text'

            // Usar setTimeout para asegurar que el DOM se actualice antes de enfocar
            setTimeout(() => {
              newElement?.focus()

              // Colocar cursor al inicio
              const range = document.createRange()
              const sel = window.getSelection()
              if (newElement) {
                range.setStart(newElement, 0)
                range.collapse(true)
                sel?.removeAllRanges()
                sel?.addRange(range)
              }
            }, 0)
          }
        }

        childRef.current.blur()
        return
      }

      // Shift+Enter: permitir nueva línea en elementos que lo soporten
      if (e.key === 'Enter' && e.shiftKey) {
        // Permitir comportamiento por defecto
        return
      }

      // Cmd/Ctrl + S para guardar
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        childRef.current?.blur()
      }

      // Cmd/Ctrl + B para negrita
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        document.execCommand('bold', false)
      }

      // Cmd/Ctrl + I para cursiva
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault()
        document.execCommand('italic', false)
      }
    }

    // Hacer el elemento editable
    element.setAttribute('contentEditable', 'true')
    element.classList.add('editable-content')
    element.style.outline = 'none'
    element.style.cursor = 'text'

    // Agregar event listeners
    element.addEventListener('blur', handleBlur)
    element.addEventListener('focus', handleFocus)
    element.addEventListener('keydown', handleKeyDown)
  }

  // Clonar el elemento hijo y agregarle la ref
  const clonedChild = React.cloneElement(
    children as React.ReactElement,
    { ref: setChildRef }
  )

  return clonedChild
}
