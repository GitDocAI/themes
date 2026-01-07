import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition } from 'react'
import { Label } from '../../Label'

export const LabelNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_,startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(node.attrs.label || 'Label')
  const [color, setColor] = useState(node.attrs.color || '#3b82f6')
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>(node.attrs.size || 'md')
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

  const handleSave = () => {
    setIsEditing(false)

    startTransition(() => {
      updateAttributes({
        label,
        color,
        size,
      })
    })
  }

  const handleCancel = () => {
    setLabel(node.attrs.label || 'Label')
    setColor(node.attrs.color || '#3b82f6')
    setSize(node.attrs.size || 'md')
    setIsEditing(false)
  }

  const isEditable = editor.isEditable

  const presetColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
  ]

  if (isEditing) {
    return (
      <NodeViewWrapper className="label-node-view">
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
              title="Delete label"
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          )}

          <div
            style={{
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
            }}
          >
            {/* Label Text */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Label Text *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: theme === 'light' ? '#111827' : '#f3f4f6',
                }}
              />
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setColor(preset.value)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      backgroundColor: preset.value,
                      border: color === preset.value ? '3px solid #000' : '1px solid #d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={preset.name}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    cursor: 'pointer',
                  }}
                  title="Custom color"
                />
              </div>
            </div>

            {/* Size */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Size
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: size === s ? '#3b82f6' : (theme === 'light' ? '#f3f4f6' : '#374151'),
                      color: size === s ? '#ffffff' : (theme === 'light' ? '#111827' : '#f3f4f6'),
                      border: size === s ? '2px solid #2563eb' : '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                disabled={!label}
                style={{
                  padding: '8px 16px',
                  backgroundColor: label ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: label ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="label-node-view">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
          display: 'inline-block',
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
            title="Delete label"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        <div
          onClick={() => {
            if (isEditable) {
              setIsEditing(true)
            }
          }}
          style={{
            cursor: isEditable ? 'pointer' : 'default',
          }}
        >
          <Label label={label} color={color} theme={theme} size={size} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
