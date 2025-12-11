import { useState } from 'react'
import type { Block } from './BlockRenderer'

interface HeadingBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  theme,
  onEdit,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState(block.content || '')
  const [level] = useState(block.level || 1)
  const isEditable = import.meta.env.VITE_MODE === 'dev'

  const handleBlur = () => {
    if (content !== block.content) {
      // Convert level back to type (h1, h2, h3)
      const type = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
      onSave({ content, type })
    }
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Enter
    if (e.key === 'Enter') {
      e.preventDefault()
      // Convert level back to type (h1, h2, h3)
      const type = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
      onSave({ content, type })
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      setContent(block.content || '')
      onCancel()
    }
  }

  const headingStyle = {
    fontSize: `${2.5 - level * 0.3}rem`,
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
    padding: '0',
    textAlign: 'left' as const,
  }

  // Si no es editable, renderizar como heading normal
  if (!isEditable) {
    switch (level) {
      case 1:
        return <h1 style={headingStyle}>{content}</h1>
      case 2:
        return <h2 style={headingStyle}>{content}</h2>
      case 3:
        return <h3 style={headingStyle}>{content}</h3>
      case 4:
        return <h4 style={headingStyle}>{content}</h4>
      case 5:
        return <h5 style={headingStyle}>{content}</h5>
      default:
        return <h6 style={headingStyle}>{content}</h6>
    }
  }

  return (
    <input
      type="text"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onFocus={onEdit}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        padding: '0',
        margin: '0 0 16px 0',
        fontSize: `${2.5 - level * 0.3}rem`,
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        color: theme === 'light' ? '#111827' : '#f9fafb',
        border: 'none',
        outline: 'none',
        textAlign: 'left',
        cursor: 'text',
      }}
      placeholder="Título..."
    />
  )
}
