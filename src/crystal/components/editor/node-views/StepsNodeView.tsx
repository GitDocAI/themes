import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'

export const StepsNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Detect theme
  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      let currentTheme: 'light' | 'dark' = 'dark'

      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        currentTheme = luminance < 0.5 ? 'dark' : 'light'
      }

      setTheme(currentTheme)
    }

    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleAddStep = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        const stepCount = node.content.childCount
        const insertPos = pos + node.nodeSize - 1
        editor.chain().focus().insertContentAt(insertPos, {
          type: 'stepBlock',
          attrs: { title: `Step ${stepCount + 1}` },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New step content' }] }],
        }).run()
      }
    }
  }

  const isEditable = editor.isEditable

  const colors = {
    bg: theme === 'light' ? '#f9fafb' : 'transparent',
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    text: theme === 'light' ? '#111827' : '#f3f4f6',
  }

  return (
    <NodeViewWrapper className="steps-node-view">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
        }}
      >
        {/* Delete button */}
        {isEditable && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
              border: `1px solid ${theme === 'light' ? '#fecaca' : '#991b1b'}`,
              color: theme === 'light' ? '#ef4444' : '#fca5a5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              transition: 'all 0.2s',
              padding: 0,
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Delete steps"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        {/* Steps content */}
        <div
          style={{
            border: isEditable ? `1px dashed ${colors.border}` : 'none',
            borderRadius: '8px',
            padding: isEditable ? '8px' : '0',
          }}
        >
          <NodeViewContent />
        </div>

        {/* Add step button */}
        {isEditable && (
          <button
            onClick={handleAddStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px',
              marginTop: '8px',
              backgroundColor: 'transparent',
              border: `1px dashed ${colors.border}`,
              borderRadius: '6px',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.color = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
            }}
          >
            <i className="pi pi-plus" style={{ fontSize: '12px' }}></i>
            Add Step
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
