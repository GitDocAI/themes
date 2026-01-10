import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'
import { ParamField } from '../../ParamField'

export const ParamNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isEditing, setIsEditing] = useState(false)
  const [editPath, setEditPath] = useState(node.attrs.path || 'param')
  const [editType, setEditType] = useState(node.attrs.type || 'string')
  const [editRequired, setEditRequired] = useState(node.attrs.required || false)
  const [editDefault, setEditDefault] = useState(node.attrs.default || '')
  const [editDescription, setEditDescription] = useState(node.attrs.description || '')

  // Sync with node attrs
  useEffect(() => {
    setEditPath(node.attrs.path || 'param')
    setEditType(node.attrs.type || 'string')
    setEditRequired(node.attrs.required || false)
    setEditDefault(node.attrs.default || '')
    setEditDescription(node.attrs.description || '')
  }, [node.attrs.path, node.attrs.type, node.attrs.required, node.attrs.default, node.attrs.description])

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
    updateAttributes({
      path: editPath,
      type: editType,
      required: editRequired,
      default: editDefault,
      description: editDescription,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditPath(node.attrs.path || 'param')
    setEditType(node.attrs.type || 'string')
    setEditRequired(node.attrs.required || false)
    setEditDefault(node.attrs.default || '')
    setEditDescription(node.attrs.description || '')
    setIsEditing(false)
  }

  const isEditable = editor.isEditable

  const colors = {
    bg: theme === 'light' ? '#f9fafb' : '#1f2937',
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    text: theme === 'light' ? '#111827' : '#f3f4f6',
    secondaryText: theme === 'light' ? '#6b7280' : '#9ca3af',
  }

  const commonTypes = ['string', 'number', 'boolean', 'object', 'array', 'integer', 'file']

  // Editing form
  if (isEditing && isEditable) {
    return (
      <NodeViewWrapper className="param-node-view">
        <div
          style={{
            margin: '1rem 0',
            position: 'relative',
          }}
        >
          <div
            style={{
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: colors.bg,
            }}
          >
            {/* Path */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Parameter Name *
              </label>
              <input
                type="text"
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
                placeholder="param_name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Type
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {commonTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditType(t)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: editType === t ? '#3b82f6' : (theme === 'light' ? '#f3f4f6' : '#374151'),
                      color: editType === t ? '#ffffff' : colors.text,
                      border: editType === t ? '2px solid #2563eb' : `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                placeholder="Custom type..."
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Required */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.text,
                }}
              >
                <input
                  type="checkbox"
                  checked={editRequired}
                  onChange={(e) => setEditRequired(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                Required parameter
              </label>
            </div>

            {/* Default */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Default Value
              </label>
              <input
                type="text"
                value={editDefault}
                onChange={(e) => setEditDefault(e.target.value)}
                placeholder="Default value (optional)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: colors.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe what this parameter does..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: colors.text,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                disabled={!editPath}
                style={{
                  padding: '8px 16px',
                  backgroundColor: editPath ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: editPath ? 'pointer' : 'not-allowed',
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

  // Display view
  return (
    <NodeViewWrapper className="param-node-view">
      <div
        style={{
          margin: '0.5rem 0',
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
            title="Delete parameter"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        <div
          onClick={() => isEditable && setIsEditing(true)}
          style={{ cursor: isEditable ? 'pointer' : 'default' }}
        >
          <ParamField
            path={node.attrs.path}
            type={node.attrs.type}
            required={node.attrs.required}
            default={node.attrs.default}
            description={node.attrs.description}
            theme={theme}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
