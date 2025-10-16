'use client'

import React, { useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface EditableArticleProps {
  children: React.ReactNode
}

const is_prod = process.env.NODE_ENV === 'production'
const webhook_url = process.env.NEXT_PUBLIC_WEBHOOK_URL || process.env.WEBHOOK_URL
const authentication = process.env.NEXT_PUBLIC_AUTHENTICATION || process.env.AUTHENTICATION

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

        case 'table':
          return processTable(el)

        case 'thead':
        case 'tbody':
        case 'tr':
        case 'th':
        case 'td':
          // Las tablas se manejan en el case 'table'
          return children

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

export function EditableArticle({ children }: EditableArticleProps) {
  const articleRef = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (is_prod || !articleRef.current) return

    const article = articleRef.current

    const sendToWebhook = async (markdown: string) => {
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
            file_path: pathname + '.mdx',
            new_content: markdown,
          }),
        })

        if (!res.ok) {
          console.error('Failed to save content:', await res.text())
        } else {
          console.log('Content saved successfully')
        }
      } catch (error) {
        console.error('Error saving content:', error)
      }
    }

    const handleBlur = () => {
      if (!isEditingRef.current || !articleRef.current) return

      // Convertir HTML a Markdown
      const markdown = htmlToMarkdown(articleRef.current)

      // Enviar al webhook
      sendToWebhook(markdown)

      isEditingRef.current = false
      article.classList.remove('editing')
    }

    const handleFocus = () => {
      isEditingRef.current = true
      article.classList.add('editing')
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S para guardar
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        article.blur()
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

    // Hacer el artículo editable
    article.setAttribute('contentEditable', 'true')
    article.classList.add('editable-article')

    // Agregar event listeners
    article.addEventListener('blur', handleBlur)
    article.addEventListener('focus', handleFocus)
    article.addEventListener('keydown', handleKeyDown)

    return () => {
      article.removeAttribute('contentEditable')
      article.classList.remove('editable-article', 'editing')
      article.removeEventListener('blur', handleBlur)
      article.removeEventListener('focus', handleFocus)
      article.removeEventListener('keydown', handleKeyDown)
    }
  }, [pathname])

  const setArticleRef = (element: HTMLElement | null) => {
    articleRef.current = element
  }

  if (is_prod) {
    return (
      <article id="mdx-content" className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
        {children}
      </article>
    )
  }

  return (
    <article
      id="mdx-content"
      ref={setArticleRef}
      className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]"
    >
      {children}
    </article>
  )
}
