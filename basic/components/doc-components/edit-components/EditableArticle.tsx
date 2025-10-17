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
          // Si el párrafo está vacío, generar un &nbsp; para preservar la línea vacía
          if (!children.trim()) {
            return `&nbsp;\n\n`
          }
          return `${children}\n\n`

        // Manejar íconos primero (antes de 'i' para italic)
        case 'i':
          // Ignorar íconos (como los de AlertBlock)
          if (el.className.includes('pi pi-')) {
            return ''
          }
          // Si no es ícono, es italic
          // Ignorar si está vacío o solo contiene <br>
          if (!children.trim() || children.trim() === '\n') {
            return ''
          }
          return `*${children}*`

        case 'strong':
        case 'b':
          // Ignorar si está vacío o solo contiene <br>
          if (!children.trim() || children.trim() === '\n') {
            return ''
          }
          return `**${children}**`

        case 'em':
          // Ignorar si está vacío o solo contiene <br>
          if (!children.trim() || children.trim() === '\n') {
            return ''
          }
          return `*${children}*`

        case 'del':
        case 's':
          return `~~${children}~~`

        case 'u':
          // HTML para subrayado (Markdown no tiene sintaxis nativa)
          // Ignorar si está vacío o solo contiene <br>
          if (!children.trim() || children.trim() === '\n') {
            return ''
          }
          return `<u>${children}</u>`

        case 'code':
          // Si es código inline (no dentro de pre)
          if (!el.closest('pre')) {
            // Ignorar si está vacío o solo contiene <br>
            if (!children.trim() || children.trim() === '\n') {
              return ''
            }
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
          case 'u':
            text += `<u>${child.textContent}</u>`
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
  const initialContentRef = useRef<string>('')
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const justSavedRef = useRef(false)
  const cursorTextPositionRef = useRef<number>(0)

  // Detectar si estamos en API Reference
  const [isApiReference, setIsApiReference] = React.useState(false)

  React.useEffect(() => {
    // Verificar si hay elemento con id="apiref" o si la URL contiene "api_reference"
    const hasApiRefElement = !!document.getElementById('apiref')
    const urlHasApiRef = pathname.toLowerCase().includes('api_reference')
    setIsApiReference(hasApiRefElement || urlHasApiRef)
  }, [pathname])

  // Capturar el contenido inicial y actualizar cuando children cambia
  useEffect(() => {
    if (is_prod || isApiReference || !contentContainerRef.current) return

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

        // Actualizar contenido
        container.innerHTML = newContent
        initialContentRef.current = newContent

        // Si acabamos de guardar, marcar como procesado y restaurar cursor
        if (justSavedRef.current) {
          justSavedRef.current = false

          // Restaurar cursor
          requestAnimationFrame(() => {
            restoreSimpleCursorPosition()
          })
        }
      }
    }
  }, [is_prod, isApiReference, children])

  // Guardar posición del cursor basada en texto plano
  const saveSimpleCursorPosition = () => {
    const container = contentContainerRef.current
    if (!container) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      cursorTextPositionRef.current = 0
      return
    }

    const range = selection.getRangeAt(0)
    let position = 0


    // Función recursiva para contar caracteres hasta el cursor
    const countUntilCursor = (node: Node): boolean => {
      // Si llegamos al nodo del cursor
      if (node === range.endContainer) {
        if (node.nodeType === Node.TEXT_NODE) {
          position += range.endOffset
        }
        return true 
      }

      // Nodo de texto
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        // Ignorar text nodes que solo contienen whitespace/newlines (son artefactos del HTML)
        if (text.trim() === '') {
          return false
        }
        const len = text.length
        position += len
        return false
      }

      // Elemento
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const tagName = element.tagName?.toLowerCase()

        // Si es un párrafo hijo directo del container
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && node.parentNode === container) {
          // Contar el contenido del párrafo
          const textContent = element.textContent || ''
          const hasContent = textContent.trim().length > 0


          // Procesar hijos
          for (const child of Array.from(node.childNodes)) {
            if (countUntilCursor(child)) return true
          }

          // Si el párrafo está vacío, contar como 1 carácter (la línea vacía)
          if (!hasContent) {
            position += 1
          }

          // Agregar salto de línea al final de cada párrafo (excepto posiblemente el último)
          position += 1
        } else {
          // Para otros elementos, solo procesar hijos
          for (const child of Array.from(node.childNodes)) {
            if (countUntilCursor(child)) return true
          }
        }
      }

      return false
    }

    countUntilCursor(container)
    cursorTextPositionRef.current = position
  }

  // Restaurar posición del cursor basada en texto plano
  const restoreSimpleCursorPosition = () => {
    const container = contentContainerRef.current
    if (!container) return

    const targetPosition = cursorTextPositionRef.current
    if (targetPosition === 0) return

    const selection = window.getSelection()
    if (!selection) return


    try {
      let currentPosition = 0
      let found = false

      // Función recursiva para buscar la posición
      const findPosition = (node: Node): boolean => {
        // Nodo de texto
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || ''
          // Ignorar text nodes que solo contienen whitespace/newlines (son artefactos del HTML)
          if (text.trim() === '') {
            return false
          }

          const textLength = text.length

          if (currentPosition + textLength >= targetPosition) {
            // Encontramos el nodo correcto
            const offset = targetPosition - currentPosition
            const range = document.createRange()
            range.setStart(node, offset)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
            return true
          }

          currentPosition += textLength
          return false
        }

        // Elemento
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          const tagName = element.tagName?.toLowerCase()

          // Si es un párrafo hijo directo del container
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && node.parentNode === container) {
            const textContent = element.textContent || ''
            const hasContent = textContent.trim().length > 0

            // Si el párrafo está vacío, verificar ANTES de procesar hijos
            if (!hasContent) {
              if (currentPosition === targetPosition) {
                // El cursor está en esta línea vacía
                const range = document.createRange()
                range.setStart(element, 0)
                range.collapse(true)
                selection.removeAllRanges()
                selection.addRange(range)
                return true
              }
              currentPosition += 1
            } else {
              // Procesar hijos solo si tiene contenido
              for (const child of Array.from(node.childNodes)) {
                if (findPosition(child)) return true
              }
            }

            // Agregar salto de línea al final de cada párrafo
            if (currentPosition === targetPosition) {
              // El cursor está al final de este párrafo
              const range = document.createRange()
              range.selectNodeContents(element)
              range.collapse(false) // Al final
              selection.removeAllRanges()
              selection.addRange(range)
              return true
            }
            currentPosition += 1
          } else {
            // Para otros elementos, solo procesar hijos
            for (const child of Array.from(node.childNodes)) {
              if (findPosition(child)) return true
            }
          }
        }

        return false
      }

      found = findPosition(container)

      // Si no se encontró, poner al final
      if (!found) {
        const range = document.createRange()
        range.selectNodeContents(container)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } catch (error) {
      console.log('Could not restore cursor:', error)
    }
  }

  // Efecto para bloquear re-renders mientras se guarda
  useLayoutEffect(() => {
    if (is_prod || isApiReference || !contentContainerRef.current) return

    const container = contentContainerRef.current

    // Si estamos bloqueando renders Y tenemos contenido guardado, restaurar
    if (shouldBlockRenderRef.current && savedContentRef.current) {
      container.innerHTML = savedContentRef.current
      // Restaurar cursor usando texto plano
      requestAnimationFrame(() => {
        restoreSimpleCursorPosition()
      })
    }
  }, [children, is_prod, isApiReference])

  useEffect(() => {
    if (is_prod || isApiReference || !articleRef.current) return

    const article = articleRef.current

    const sendToWebhook = async (markdown: string) => {
      if (!webhook_url) {
        console.warn('No webhook URL configured')
        return
      }

      try {
        // Guardar la posición del cursor
        saveSimpleCursorPosition()

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

          // Marcar que acabamos de guardar para que el próximo hot reload sea esperado
          justSavedRef.current = true

          // Esperar solo 500ms para que el webhook procese el archivo
          await new Promise(resolve => setTimeout(resolve, 500))

          // Desbloquear para permitir el hot reload
          shouldBlockRenderRef.current = false
          savedContentRef.current = ''


          // Limpiar la flag después de 2 segundos por seguridad
          setTimeout(() => {
            justSavedRef.current = false
          }, 2000)
        } else {
          shouldBlockRenderRef.current = false
          savedContentRef.current = ''
        }

      } catch (error) {
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

      // Enter: Limpiar formatos inline después de crear nueva línea
      if (e.key === 'Enter') {
        setTimeout(() => {
          const selection = window.getSelection()
          if (!selection || selection.rangeCount === 0) return

          const range = selection.getRangeAt(0)
          let node = range.startContainer as Node

          // Si estamos dentro de un formato inline (strong, em, u, code), salir de él
          while (node && node !== contentContainerRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              const tag = element.tagName?.toLowerCase()

              if (['strong', 'em', 'u', 'code', 'b', 'i'].includes(tag)) {
                // Mover el cursor fuera del elemento de formato
                const newRange = document.createRange()
                newRange.setStartAfter(element)
                newRange.collapse(true)
                selection.removeAllRanges()
                selection.addRange(newRange)
                break
              }
            }
            node = node.parentNode!
          }
        }, 0)
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

    // Listener para guardados forzados desde el DevToolbar
    const handleForceSave = () => {
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

      // Agregar listener para guardado forzado desde DevToolbar
      document.addEventListener('devtoolbar:save', handleForceSave as EventListener)

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
        document.removeEventListener('devtoolbar:save', handleForceSave as EventListener)
      }
    }
  }, [pathname, webhook_url, authentication, is_prod, isApiReference])

  const setArticleRef = (element: HTMLElement | null) => {
    if (element && !articleRef.current) {
      articleRef.current = element
    }
  }

  if (is_prod || isApiReference) {
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

