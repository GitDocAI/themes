import { useState, useRef, useEffect } from 'react'
import type { Block } from './BlockRenderer'

interface ParagraphBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
  onSplit?: (currentContent: string, nextContent: string) => void
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({
  block,
  theme,
  onEdit,
  onCancel,
  onSave,
  onSplit,
}) => {
  const [content, setContent] = useState(block.content || '')
  const contentRef = useRef<HTMLParagraphElement>(null)
  const isEditable = import.meta.env.VITE_MODE === 'dev'

  // Sync content state when block.content changes from parent
  useEffect(() => {
    setContent(block.content || '')
  }, [block.content])

  // Helper function to render markdown-style text (bold, italic)
  const renderMarkdown = (text: string) => {
    // Replace ***bold italic*** with <strong><em>
    let result = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Replace **bold** with <strong>
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace *italic* with <em>
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>')
    return result
  }

  // Convert HTML back to markdown when saving
  const htmlToMarkdown = (html: string) => {
    // Replace <strong><em> with ***
    let result = html.replace(/<strong><em>(.*?)<\/em><\/strong>/g, '***$1***')
    // Replace <em><strong> with ***
    result = result.replace(/<em><strong>(.*?)<\/strong><\/em>/g, '***$1***')
    // Replace <strong> with **
    result = result.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    // Replace <em> with *
    result = result.replace(/<em>(.*?)<\/em>/g, '*$1*')
    // Remove any remaining HTML tags
    result = result.replace(/<[^>]*>/g, '')
    return result
  }

  const handleBlur = () => {
    if (contentRef.current) {
      const newContent = htmlToMarkdown(contentRef.current.innerHTML)
      if (newContent !== block.content) {
        onSave({ content: newContent })
      }
    }
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter to split paragraph
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      if (onSplit && contentRef.current) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)

          // Create ranges for before and after cursor
          const beforeRange = document.createRange()
          beforeRange.setStartBefore(contentRef.current.firstChild || contentRef.current)
          beforeRange.setEnd(range.startContainer, range.startOffset)

          const afterRange = document.createRange()
          afterRange.setStart(range.startContainer, range.startOffset)
          afterRange.setEndAfter(contentRef.current.lastChild || contentRef.current)

          // Extract HTML and convert to markdown
          const beforeDiv = document.createElement('div')
          beforeDiv.appendChild(beforeRange.cloneContents())
          const beforeHTML = beforeDiv.innerHTML
          const beforeText = htmlToMarkdown(beforeHTML)

          const afterDiv = document.createElement('div')
          afterDiv.appendChild(afterRange.cloneContents())
          const afterHTML = afterDiv.innerHTML
          const afterText = htmlToMarkdown(afterHTML)

          // Call onSplit with the two parts
          onSplit(beforeText, afterText)
        }
      } else {
        // Fallback: just blur if no onSplit handler
        contentRef.current?.blur()
      }
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      setContent(block.content || '')
      onCancel()
    }
  }

  // Si no es editable, renderizar como párrafo normal
  if (!isEditable) {
    return (
      <p
        style={{
          fontSize: '1rem',
          lineHeight: '1.8',
          color: theme === 'light' ? '#374151' : '#d1d5db',
          margin: '0 0 16px 0',
          padding: '0',
          textAlign: 'left',
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    )
  }

  return (
    <p
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      data-block-id={block.id}
      onFocus={onEdit}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        padding: '0',
        margin: '0 0 16px 0',
        fontSize: '1rem',
        lineHeight: '1.8',
        color: theme === 'light' ? '#374151' : '#d1d5db',
        backgroundColor: 'transparent',
        border: 'none',
        fontFamily: 'inherit',
        outline: 'none',
        textAlign: 'left',
        cursor: 'text',
        minHeight: '1.8em'
      }}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}
