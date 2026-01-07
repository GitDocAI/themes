import { useState } from 'react'
import { SimpleCard } from '../SimpleCard'
import type { Block } from './BlockRenderer'

interface CardBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const CardBlock: React.FC<CardBlockProps> = ({
  block,
  theme,
  onEdit,
  onCancel,
  onSave,
}) => {
  const [title, setTitle] = useState(block.title || '')
  const [content, setContent] = useState(block.content || '')
  const isEditable = import.meta.env.VITE_MODE === 'dev'

  const handleBlur = () => {
    if (title !== block.title || content !== block.content) {
      onSave({ title, content })
    }
    onCancel()
  }

  // Si no es editable, renderizar sin inputs
  if (!isEditable) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <SimpleCard
          icon={block.icon || 'pi-info-circle'}
          title={title}
          theme={theme}
        >
          {content}
        </SimpleCard>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <SimpleCard
        icon={block.icon || 'pi-info-circle'}
        theme={theme}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={onEdit}
          onBlur={handleBlur}
          placeholder="Título de la card..."
          style={{
            width: '100%',
            padding: '0',
            marginBottom: '12px',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            backgroundColor: 'transparent',
            color: theme === 'light' ? '#111827' : '#f9fafb',
            border: 'none',
            outline: 'none',
            cursor: 'text',
          }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={onEdit}
          onBlur={handleBlur}
          placeholder="Contenido de la card..."
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '0',
            fontSize: '1rem',
            lineHeight: '1.6',
            backgroundColor: 'transparent',
            color: theme === 'light' ? '#374151' : '#d1d5db',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            cursor: 'text',
          }}
        />
      </SimpleCard>
    </div>
  )
}
