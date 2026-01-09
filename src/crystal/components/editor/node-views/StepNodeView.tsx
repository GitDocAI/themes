import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'

export const StepNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(node.attrs.title || 'Step')

  // Sync title with node attrs
  useEffect(() => {
    setTitle(node.attrs.title || 'Step')
  }, [node.attrs.title])

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

  // Get step number and total count by finding position in parent
  const getStepInfo = () => {
    if (!getPos) return { number: 1, isLast: true }
    const pos = getPos()
    if (typeof pos !== 'number') return { number: 1, isLast: true }

    const resolvedPos = editor.state.doc.resolve(pos)
    const parent = resolvedPos.parent
    const totalSteps = parent.childCount

    // Count siblings before this node
    let count = 1
    const parentPos = resolvedPos.before(resolvedPos.depth)
    editor.state.doc.nodesBetween(parentPos, pos, (n, p) => {
      if (n.type.name === 'stepBlock' && p < pos) {
        count++
      }
    })

    return { number: count, isLast: count === totalSteps }
  }

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleTitleSave = () => {
    updateAttributes({ title })
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitle(node.attrs.title || 'Step')
      setIsEditingTitle(false)
    }
  }

  const isEditable = editor.isEditable
  const { number: stepNumber, isLast } = getStepInfo()

  const colors = {
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    text: theme === 'light' ? '#111827' : '#f3f4f6',
    secondaryText: theme === 'light' ? '#6b7280' : '#9ca3af',
    numberBg: theme === 'light' ? '#f3f4f6' : '#374151',
    numberText: theme === 'light' ? '#374151' : '#d1d5db',
  }

  return (
    <NodeViewWrapper className="step-node-view">
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px 0',
          position: 'relative',
        }}
      >
        {/* Delete button for individual step */}
        {isEditable && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '8px',
              right: '-8px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
              border: `1px solid ${theme === 'light' ? '#fecaca' : '#991b1b'}`,
              color: theme === 'light' ? '#ef4444' : '#fca5a5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              transition: 'all 0.2s',
              padding: 0,
              zIndex: 10,
              opacity: 0.7,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            title="Delete step"
          >
            <i className="pi pi-times" style={{ fontSize: '9px' }}></i>
          </button>
        )}

        {/* Step number with connecting line */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Number circle */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: colors.numberBg,
              color: colors.numberText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '500',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {stepNumber}
          </div>
          {/* Connecting line - hidden on last step */}
          {!isLast && (
            <div
              style={{
                width: '1px',
                flex: 1,
                backgroundColor: colors.border,
                minHeight: '20px',
              }}
            />
          )}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          {isEditable && isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              style={{
                width: '100%',
                padding: '4px 8px',
                marginBottom: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                color: colors.text,
                outline: 'none',
              }}
            />
          ) : (
            <h4
              onClick={() => isEditable && setIsEditingTitle(true)}
              style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text,
                cursor: isEditable ? 'pointer' : 'default',
              }}
              title={isEditable ? 'Click to edit title' : ''}
            >
              {title}
            </h4>
          )}

          {/* Content */}
          <div
            style={{
              color: colors.secondaryText,
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            <NodeViewContent />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
