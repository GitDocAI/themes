import { useState } from 'react'
import { CodeGroup, CodeTab } from '../CodeGroup'
import type { Block } from './BlockRenderer'

interface CodeExample {
  title: string
  language: string
  code: string
}

interface CodeGroupBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const CodeGroupBlock: React.FC<CodeGroupBlockProps> = ({
  block,
  theme,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}) => {
  const [examples, setExamples] = useState<CodeExample[]>(block.examples || [])

  const handleSave = () => {
    onSave({ examples })
  }

  const addExample = () => {
    setExamples([...examples, { title: 'New Example', language: 'javascript', code: '' }])
  }

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index))
  }

  const updateExample = (index: number, field: keyof CodeExample, value: string) => {
    const newExamples = [...examples]
    newExamples[index] = { ...newExamples[index], [field]: value }
    setExamples(newExamples)
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
        {examples.map((example, index) => (
          <div
            key={index}
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                Example {index + 1}
              </h4>
              <button
                onClick={() => removeExample(index)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <i className="pi pi-trash"></i>
              </button>
            </div>
            <input
              type="text"
              placeholder="Title"
              value={example.title}
              onChange={(e) => updateExample(index, 'title', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                color: theme === 'light' ? '#111827' : '#f9fafb',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <select
              value={example.language}
              onChange={(e) => updateExample(index, 'language', e.target.value)}
              style={{
                padding: '6px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                color: theme === 'light' ? '#111827' : '#f9fafb',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '8px',
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
            <textarea
              placeholder="Code"
              value={example.code}
              onChange={(e) => updateExample(index, 'code', e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '6px',
                fontFamily: 'monospace',
                fontSize: '14px',
                backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                color: theme === 'light' ? '#111827' : '#f9fafb',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </div>
        ))}
        <button
          onClick={addExample}
          style={{
            padding: '6px 12px',
            backgroundColor: theme === 'light' ? '#3b82f6' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '8px',
          }}
        >
          <i className="pi pi-plus"></i> Add Example
        </button>
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
      <CodeGroup dropdown theme={theme}>
        {examples.map((example, index) => (
          <CodeTab
            key={index}
            title={example.title}
            lang={example.language}
            code={example.code}
          />
        ))}
      </CodeGroup>
    </div>
  )
}
