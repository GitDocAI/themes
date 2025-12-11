import { useState } from 'react'
import type { Block } from './BlockRenderer'

interface ListBlockProps {
  block: Block
  theme: 'light' | 'dark'
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (data: Partial<Block>) => void
}

export const ListBlock: React.FC<ListBlockProps> = ({
  block,
  theme,
  isEditing,
  onCancel,
  onSave,
}) => {
  const [items, setItems] = useState<string[]>(block.items || [])
  const [ordered, setOrdered] = useState(block.ordered || false)

  const handleSave = () => {
    // Convert ordered back to type (numbered-list or bullet-list)
    const type = ordered ? 'numbered-list' : 'bullet-list'
    onSave({ items, type })
  }

  const addItem = () => {
    setItems([...items, ''])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={ordered}
              onChange={(e) => setOrdered(e.target.checked)}
            />
            Ordered list
          </label>
        </div>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
                color: theme === 'light' ? '#111827' : '#f9fafb',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <button
              onClick={() => removeItem(index)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <i className="pi pi-trash"></i>
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
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
          <i className="pi pi-plus"></i> Add Item
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

  const ListTag = ordered ? 'ol' : 'ul'

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

  const handleItemBlur = (index: number, e: React.FocusEvent<HTMLSpanElement>) => {
    const newValue = htmlToMarkdown(e.currentTarget.innerHTML)
    if (newValue !== items[index]) {
      const newItems = [...items]
      newItems[index] = newValue
      setItems(newItems)
      // Convert ordered back to type (numbered-list or bullet-list)
      const type = ordered ? 'numbered-list' : 'bullet-list'
      onSave({ items: newItems, type })
    }
  }

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <ListTag
      style={{
        listStyle: ordered ? 'decimal' : 'disc',
        paddingLeft: '24px',
        marginBottom: '16px',
        color: theme === 'light' ? '#374151' : '#d1d5db',
        textAlign: 'left'
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          style={{
            marginBottom: '8px',
            lineHeight: '1.75'
          }}
        >
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleItemBlur(index, e)}
            onKeyDown={handleItemKeyDown}
            style={{
              display: 'block',
              outline: 'none',
              cursor: 'text'
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item) }}
          />
        </li>
      ))}
    </ListTag>
  )
}
