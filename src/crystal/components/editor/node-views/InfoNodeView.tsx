import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'

export const InfoNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [type, setType] = useState(node.attrs.type || 'info')
  const [title, setTitle] = useState(node.attrs.title || '')
  const [content, setContent] = useState(node.attrs.content || '')
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

  const handleSave = () => {
    updateAttributes({
      type,
      title,
      content,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setType(node.attrs.type || 'info')
    setTitle(node.attrs.title || '')
    setContent(node.attrs.content || '')
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const getTypeConfig = (infoType: string) => {
    switch (infoType) {
      case 'warning':
        return { icon: 'pi pi-exclamation-triangle', color: '#f59e0b', textColor: 'rgba(255, 230, 150, 0.7)', bgColor: theme === 'light' ? '#fef3c7' : 'rgba(234, 179, 8, 0.1)', borderColor: '#f59e0b' }
      case 'error':
        return { icon: 'pi pi-times-circle', color: '#ef4444', textColor: 'rgba(255, 180, 180, 0.7)', bgColor: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }
      case 'success':
        return { icon: 'pi pi-check-circle', color: '#10b981', textColor: 'rgba(180, 230, 180, 0.7)', bgColor: theme === 'light' ? '#d1fae5' : 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }
      case 'tip':
        return { icon: 'pi pi-lightbulb', color: '#8b5cf6', textColor: 'rgba(200, 180, 255, 0.7)', bgColor: theme === 'light' ? '#ede9fe' : 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6' }
      default:
        return { icon: 'pi pi-info-circle', color: '#3b82f6', textColor: 'rgba(170, 200, 255, 0.7)', bgColor: theme === 'light' ? '#dbeafe' : 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }
    }
  }

  const isEditable = editor.isEditable

  if (isEditing) {
    return (
      <NodeViewWrapper className="info-node-view">
        <div
          style={{
            margin: '1rem 0',
            position: 'relative',
          }}
        >
          {/* Delete button - top right corner */}
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
              title="Delete info"
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          )}

          <div
            style={{
              border: '2px solid #3b82f6',
              borderRadius: '16px',
              padding: '16px',
              backgroundColor: '#f9fafb',
            }}
          >
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                  <option value="tip">Tip</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Info title (optional)"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the info content..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
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

  const typeConfig = getTypeConfig(type)
  return (
    <NodeViewWrapper className="info-node-view">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
        }}
      >
        {/* Delete button - top right corner */}
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
            title="Delete info"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        <div
          onClick={() => setIsEditing(true)}
          style={{
            border: `2px solid ${typeConfig.borderColor}`,
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: typeConfig.bgColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <i className={typeConfig.icon} style={{ fontSize: '24px', color: typeConfig.color, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              {title && (
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: theme === 'light' ? '#1f2937' : '#ffffff' }}>
                  {title}
                </h4>
              )}
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: theme === 'light' ? '#1f2937' : typeConfig.textColor }}>
                {content || 'No content'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
