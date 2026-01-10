import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect} from 'react'

export const HorizontalRuleNodeView = ({ node, editor, getPos }: NodeViewProps) => {
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


  const borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
  const isEditable = editor.isEditable
  return (
    <NodeViewWrapper
      className="horizontal-rule-block-wrapper"
      data-type="horizontal-rule-block"
      style={{ outline: 'none' }}
    >
      <div style={{ position: 'relative', margin: '48px 0' }}>
        <hr
          style={{
            width: '100%',
            border: 'none',
            borderTop: `1px solid ${borderColor}`,
            margin: 0,
            opacity: 0.5,
          }}
        />
        {isEditable && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '-12px',
              right: '0',
              padding: '4px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            <i className="pi pi-trash" style={{ fontSize: '10px', marginRight: '4px' }}></i>
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}

