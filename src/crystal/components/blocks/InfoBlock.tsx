import { useState } from 'react'
import type { Block } from './BlockRenderer'

interface InfoBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const InfoBlock: React.FC<InfoBlockProps> = ({
  block,
  theme,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState(block.content || '')

  if (isEditing) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: theme === 'light' ? '#f0f9ff' : '#1e293b',
          border: `2px solid ${theme === 'light' ? '#3b82f6' : '#6366f1'}`,
          borderRadius: '16px',
          marginBottom: '16px',
        }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
            color: theme === 'light' ? '#111827' : '#f9fafb',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onSave({ content })}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#dbeafe'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#eff6ff'
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
        <i className="pi pi-info-circle" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
        <p style={{ margin: 0, color: '#1e40af', lineHeight: '1.6' }}>{content}</p>
      </div>
    </div>
  )
}
