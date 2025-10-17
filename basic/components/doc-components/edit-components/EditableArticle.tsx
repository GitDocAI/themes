'use client'

import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

interface EditableArticleProps {
  children: React.ReactNode
 is_prod :boolean
 webhook_url :string
 authentication :string
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

        case 'img': {
          const src = el.getAttribute('src') || ''
          const alt = el.getAttribute('alt') || ''
          const imgWidth = el.style.width || el.getAttribute('width')

          // Si tiene ancho especificado, incluirlo en el markdown
          if (imgWidth) {
            const widthValue = imgWidth.replace('px', '')
            return `<img src="${src}" alt="${alt}" width="${widthValue}" />\n\n`
          }

          return `![${alt}](${src})\n\n`
        }

        case 'br':
          return '\n'

        case 'hr':
          return '---\n\n'

        case 'table':
          return processTable(el)

        case 'thead':
        case 'tbody':
        case 'tr':
        case 'th':
        case 'td':
          // Las tablas se manejan en el case 'table'
          return children

        // Divs y spans - verificar si son componentes especiales
        case 'div': {
          // Detectar AlertBlock (Tip, Note, Warning, Danger, Info)
          const classes = el.className || ''

          // Detectar tipo de alerta por las clases de color
          let alertType: string | null = null
          if (classes.includes('border-green-500')) {
            alertType = 'Tip'
          } else if (classes.includes('border-blue-500')) {
            alertType = 'Note'
          } else if (classes.includes('border-yellow-500')) {
            alertType = 'Warning'
          } else if (classes.includes('border-red-500')) {
            alertType = 'Danger'
          } else if (classes.includes('border-sky-500')) {
            alertType = 'Info'
          }

          if (alertType) {
            // Obtener el contenido sin el ícono
            // El AlertBlock tiene un <i> para el ícono y un <div> con el contenido
            const contentDiv = el.querySelector('div.text-secondary')
            if (contentDiv) {
              const alertContent = Array.from(contentDiv.childNodes).map(processNode).join('')
              return `<${alertType}>\n${alertContent.trim()}\n</${alertType}>\n\n`
            }
            // Fallback si no encuentra el div interno
            return `<${alertType}>\n${children}\n</${alertType}>\n\n`
          }

          // Si no es un componente especial, solo retornar el contenido
          return children
        }

        case 'i':
          // Ignorar íconos (como los de AlertBlock)
          if (el.className.includes('pi pi-')) {
            return ''
          }
          return `*${children}*`

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

  const processTable = (table: HTMLElement): string => {
    const rows = Array.from(table.querySelectorAll('tr'))
    if (rows.length === 0) return ''

    let tableMarkdown = '\n'

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      const cellTexts = cells.map(cell => extractTextFromElement(cell as HTMLElement))
      tableMarkdown += `| ${cellTexts.join(' | ')} |\n`

      // Agregar separador después del header
      if (rowIndex === 0) {
        tableMarkdown += `| ${cells.map(() => '---').join(' | ')} |\n`
      }
    })

    return tableMarkdown + '\n'
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

export function EditableArticle({ children,is_prod,webhook_url,authentication }: EditableArticleProps) {
  const articleRef = useRef<HTMLElement | null>(null)
  const contentContainerRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const isEditingRef = useRef(false)
  const savedContentRef = useRef<string>('')
  const shouldBlockRenderRef = useRef(false)
  const cursorPositionRef = useRef<number>(0)
  const initialContentRef = useRef<string>('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const justSavedRef = useRef(false)

  // Capturar el contenido inicial y actualizar cuando children cambia
  useEffect(() => {
    if (is_prod || !contentContainerRef.current) return

    const container = contentContainerRef.current
    const childrenDiv = container.nextElementSibling

    if (!childrenDiv) return

    // Si NO estamos bloqueando renders, actualizar el contenido
    if (!shouldBlockRenderRef.current && childrenDiv.innerHTML) {
      const newContent = childrenDiv.innerHTML

      // Primera vez: guardar como inicial
      if (!initialContentRef.current) {
        initialContentRef.current = newContent
        container.innerHTML = newContent

        // Ocultar el div de children
        ;(childrenDiv as HTMLElement).style.display = 'none'
        // Mostrar el contenedor editable
        container.style.display = 'block'
      }
      // Actualizaciones posteriores (cambios en el MDX externo)
      else if (newContent !== container.innerHTML) {
        console.log('External MDX change detected, updating content')

        // Guardar posición del cursor actual
        const cursorPos = getAbsoluteCursorPosition()
        const oldContentLength = container.textContent?.length || 0
        const newContentLength = newContent.replace(/<[^>]*>/g, '').length

        // Actualizar contenido
        container.innerHTML = newContent
        initialContentRef.current = newContent

        // Si acabamos de guardar, es un cambio esperado (del webhook)
        if (justSavedRef.current) {
          console.log('This is an expected change from webhook, rendering new content')
          justSavedRef.current = false

          // Mantener el cursor en la misma posición si es posible
          requestAnimationFrame(() => {
            if (cursorPos > 0 && cursorPos <= newContentLength) {
              setAbsoluteCursorPosition(cursorPos)
            } else if (newContentLength > 0) {
              setAbsoluteCursorPosition(newContentLength)
            }
          })
        }
        // Cambio externo (editaste el MDX directamente)
        else {
          // Restaurar cursor de forma inteligente
          requestAnimationFrame(() => {
            // Si se eliminó contenido y el cursor estaba más allá del nuevo contenido
            if (newContentLength < oldContentLength && cursorPos > newContentLength) {
              // Poner el cursor al final del nuevo contenido
              setAbsoluteCursorPosition(newContentLength)
            }
            // Si se agregó contenido o el cursor está dentro del rango
            else if (cursorPos > 0 && cursorPos <= newContentLength) {
              // Mantener la posición del cursor
              setAbsoluteCursorPosition(cursorPos)
            }
            // Si no hay cursor o está fuera de rango, poner al final
            else if (newContentLength > 0) {
              setAbsoluteCursorPosition(newContentLength)
            }
          })
        }
      }
    }
  }, [is_prod, children])

  // Función para obtener la posición absoluta del cursor en el texto
  const getAbsoluteCursorPosition = (): number => {
    const selection = window.getSelection()
    const container = contentContainerRef.current || articleRef.current
    if (!selection || selection.rangeCount === 0 || !container) return 0

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(container)
    preCaretRange.setEnd(range.endContainer, range.endOffset)

    return preCaretRange.toString().length
  }

  // Función para establecer el cursor en una posición absoluta
  const setAbsoluteCursorPosition = (position: number) => {
    const container = contentContainerRef.current || articleRef.current
    if (!container) return

    const selection = window.getSelection()
    if (!selection) return

    let charCount = 0

    const findPosition = (node: Node): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0
        if (charCount + textLength >= position) {
          const range = document.createRange()
          const offset = position - charCount
          range.setStart(node, Math.min(offset, textLength))
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
          return true
        }
        charCount += textLength
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (const child of Array.from(node.childNodes)) {
          if (findPosition(child)) return true
        }
      }
      return false
    }

    findPosition(container)
  }

  // Función para guardar la posición del cursor
  const saveCursorPosition = () => {
    cursorPositionRef.current = getAbsoluteCursorPosition()
  }

  // Función para restaurar la posición del cursor
  const restoreCursorPosition = () => {
    if (!articleRef.current) return

    try {
      setAbsoluteCursorPosition(cursorPositionRef.current)
    } catch (error) {
      console.log('Could not restore cursor position:', error)
    }
  }

  // Efecto para bloquear re-renders mientras se guarda
  // NUEVA ESTRATEGIA: No intentar restaurar, simplemente devolver el contenido guardado
  useLayoutEffect(() => {
    if (is_prod || !contentContainerRef.current) return

    const container = contentContainerRef.current

    // Si estamos bloqueando renders Y tenemos contenido guardado, restaurar
    if (shouldBlockRenderRef.current && savedContentRef.current) {
      container.innerHTML = savedContentRef.current

      // Restaurar cursor
      requestAnimationFrame(() => {
        restoreCursorPosition()
      })
    }
  }, [children, is_prod])

  useEffect(() => {
    if (is_prod || !articleRef.current) return

    const article = articleRef.current

    const sendToWebhook = async (markdown: string) => {
      if (!webhook_url) {
        console.warn('No webhook URL configured')
        return
      }

      try {
        // Guardar la posición del cursor PRIMERO
        saveCursorPosition()

        // Guardar el contenido HTML actual antes de enviar
        const container = contentContainerRef.current
        if (container) {
          savedContentRef.current = container.innerHTML
        }

        // Activar bloqueo de renders INMEDIATAMENTE
        shouldBlockRenderRef.current = true

        const res = await fetch(webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authentication && { 'Authorization': authentication })
          },
          body: JSON.stringify({
            file_path: pathname + '.mdx',
            new_text: markdown,
          }),
        })

        if (res.ok) {
          console.log('Content saved successfully')

          // Marcar que acabamos de guardar para que el próximo hot reload sea esperado
          justSavedRef.current = true

          // Esperar solo 500ms para que el webhook procese el archivo
          await new Promise(resolve => setTimeout(resolve, 500))

          // Desbloquear para permitir el hot reload
          shouldBlockRenderRef.current = false
          savedContentRef.current = ''

          console.log('Unblocked, waiting for hot reload to render changes')

          // Limpiar la flag después de 2 segundos por seguridad
          setTimeout(() => {
            justSavedRef.current = false
          }, 2000)
        } else {
          console.log('Failed to save content:', await res.text())
          shouldBlockRenderRef.current = false
          savedContentRef.current = ''
        }

      } catch (error) {
        console.log('Error saving content:', error)
        shouldBlockRenderRef.current = false
        savedContentRef.current = ''
      }
    }

    const handleBlur = () => {
      if (!isEditingRef.current) return

      const container = contentContainerRef.current
      if (!container) return

      // Limpiar cualquier debounce pendiente
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }

      // Convertir HTML a Markdown
      const markdown = htmlToMarkdown(container)

      // Enviar al webhook
      sendToWebhook(markdown)

      isEditingRef.current = false
      if (article) {
        article.classList.remove('editing')
      }
    }

    const handleFocus = () => {
      isEditingRef.current = true
      if (article) {
        article.classList.add('editing')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S para guardar
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()

        const container = contentContainerRef.current
        if (!container) return

        // Limpiar debounce si existe
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
          debounceTimeoutRef.current = null
        }

        // Convertir HTML a Markdown
        const markdown = htmlToMarkdown(container)

        // Enviar al webhook
        sendToWebhook(markdown)

      }
    }

    const handleInput = () => {
      if (!isEditingRef.current) return

      // Limpiar timeout anterior
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Crear nuevo timeout de 3 segundos
      debounceTimeoutRef.current = setTimeout(() => {
        const container = contentContainerRef.current
        if (!container || !isEditingRef.current) return

        // Convertir HTML a Markdown
        const markdown = htmlToMarkdown(container)

        // Enviar al webhook
        sendToWebhook(markdown)

      }, 3000)
    }

    // Hacer el contenedor editable
    const container = contentContainerRef.current
    if (container) {
      container.setAttribute('contentEditable', 'true')
      container.classList.add('editable-article')

      // Agregar event listeners al contenedor
      container.addEventListener('blur', handleBlur)
      container.addEventListener('focus', handleFocus)
      container.addEventListener('keydown', handleKeyDown)
      container.addEventListener('input', handleInput)

      return () => {
        // Limpiar debounce al desmontar
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }

        container.removeAttribute('contentEditable')
        container.classList.remove('editable-article', 'editing')
        container.removeEventListener('blur', handleBlur)
        container.removeEventListener('focus', handleFocus)
        container.removeEventListener('keydown', handleKeyDown)
        container.removeEventListener('input', handleInput)
      }
    }
  }, [pathname, webhook_url, authentication, is_prod])

  const setArticleRef = (element: HTMLElement | null) => {
    if (element && !articleRef.current) {
      articleRef.current = element
    }
  }

  if (is_prod) {
    return (
      <article id="mdx-content" className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
        {children}
      </article>
    )
  }

  // Renderizar usando un wrapper que React no toca directamente
  return (
    <article
      id="mdx-content"
      ref={setArticleRef}
      className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]"
    >
      {/* Contenedor editable - React no debe tocar su contenido */}
      <div
        ref={contentContainerRef}
        suppressHydrationWarning
        style={{ display: 'none' }}
      />
      {/* Contenedor de children - se oculta después de copiar */}
      <div suppressHydrationWarning>
        {children}
      </div>
    </article>
  )
}

