import { useState } from 'react'
import { CodeGroup, CodeTab } from '../CodeGroup'
import type { Block } from './BlockRenderer'

interface CodeBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  block,
  theme,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}) => {
  const [content, setContent] = useState(block.content || '')
  const [language, setLanguage] = useState(block.language || 'javascript')
  const [title, setTitle] = useState(block.title || '')

  const handleSave = () => {
    onSave({ content, language, title })
  }

  if (isEditing) {
    return (
      <div
        style={{
          padding: '12px',
          backgroundColor: theme === 'light' ? '#f0f9ff' : '#1e293b',
          border: `2px solid ${theme === 'light' ? '#3b82f6' : '#6366f1'}`,
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Title (optional):
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
              color: theme === 'light' ? '#111827' : '#f9fafb',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          />
        </div>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Language:
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px',
              backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
              color: theme === 'light' ? '#111827' : '#f9fafb',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="bash">Bash</option>
          </select>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
            color: theme === 'light' ? '#111827' : '#f9fafb',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '8px',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
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
              fontSize: '14px',
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
        marginBottom: '16px',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {title && (
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
          {title}
        </h3>
      )}
      <CodeGroup theme={theme}>
        <CodeTab name={title || 'code'} lang={language} code={content} />
      </CodeGroup>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
        className="edit-hint"
      >
        Click to edit
      </div>
      <style>{`
        div:has(> .edit-hint):hover .edit-hint {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
