import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'

export const RightPanelNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Detect theme from document
  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        setTheme(luminance < 0.5 ? 'dark' : 'light')
      } else {
        setTheme('dark')
      }
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

  const isEditable = editor.isEditable

  const textColor = theme === 'light' ? '#6b7280' : '#9ca3af'
  const buttonBg = theme === 'light' ? '#ffffff' : '#374151'
  const buttonBorder = theme === 'light' ? '#d1d5db' : '#4b5563'

  if (isEditable) {
    // Dev mode - show editable content with visual indicator
    // This content will also be displayed in the right sidebar
    return (
      <NodeViewWrapper className="right-panel-wrapper">
        <div
          style={{
            margin: '1rem 0',
            position: 'relative',
          }}
        >
          {/* Controls - top right */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '0',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            {/* Label indicator */}
            <button
              disabled
              style={{
                padding: '4px 10px',
                backgroundColor: buttonBg,
                color: textColor,
                border: `1px solid ${buttonBorder}`,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'default',
                opacity: 0.8,
              }}
              title="Right Panel Content"
            >
              <i className="pi pi-bars" style={{ fontSize: '10px' }}></i>
              Right Panel
            </button>

            {/* Delete button - small circle with X */}
            <button
              onClick={handleDelete}
              style={{
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Delete right panel"
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          </div>

          {/* Editable content area */}
          <NodeViewContent
            as="div"
            className="right-panel-content-editable"
          />
        </div>
      </NodeViewWrapper>
    )
  }

  // Preview mode - completely hidden (content will be shown in right sidebar)
  return (
    <NodeViewWrapper className="right-panel-wrapper">
      <div
        data-type="right-panel"
        data-right-panel-id={node.attrs.id}
        style={{ display: 'none' }}
      >
        <NodeViewContent
          as="div"
          className="right-panel-content-preview"
        />
      </div>
    </NodeViewWrapper>
  )
}
