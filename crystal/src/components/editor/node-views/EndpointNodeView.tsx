import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition } from 'react'
import { Endpoint } from '../../Endpoint'

export const EndpointNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>(node.attrs.method || 'GET')
  const [path, setPath] = useState(node.attrs.path || '/api/endpoint')
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
        method,
        path,
      })
    })
  }

  const handleCancel = () => {
    setMethod(node.attrs.method || 'GET')
    setPath(node.attrs.path || '/api/endpoint')
    setIsEditing(false)
  }

  const isEditable = editor.isEditable

  if (isEditing) {
    return (
      <NodeViewWrapper className="endpoint-node-view">
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
              title="Delete endpoint"
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
            {/* Method */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                HTTP Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: theme === 'light' ? '#111827' : '#f3f4f6',
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* Path */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                API Path *
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/endpoint"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: theme === 'light' ? '#111827' : '#f3f4f6',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                disabled={!path}
                style={{
                  padding: '8px 16px',
                  backgroundColor: path ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: path ? 'pointer' : 'not-allowed',
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
    <NodeViewWrapper className="endpoint-node-view">
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
            title="Delete endpoint"
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
          <Endpoint method={method} path={path} theme={theme} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
