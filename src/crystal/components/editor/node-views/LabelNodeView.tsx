import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import { Label } from '../../Label'
import { IconPicker, IconRenderer } from '../../common/IconPicker'
import type { LabelItem } from '../extensions/LabelBlock'

export const LabelNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<LabelItem | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconPickerPosition, setIconPickerPosition] = useState({ top: 0, left: 0 })
  const iconButtonRef = useRef<HTMLButtonElement>(null)

  // Convert old single-label format to new multi-label format
  const getLabels = (): LabelItem[] => {
    // If we have the new labels JSON string, parse it
    if (node.attrs.labels && typeof node.attrs.labels === 'string' && node.attrs.labels !== '[]') {
      try {
        const parsed = JSON.parse(node.attrs.labels)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch {
        // Fall through to other formats
      }
    }
    // Support old array format (backwards compatibility)
    if (node.attrs.labels && Array.isArray(node.attrs.labels) && node.attrs.labels.length > 0) {
      return node.attrs.labels
    }
    // Otherwise, convert old single-label format to new format
    if (node.attrs.label) {
      return [{
        id: `label-item-${Date.now()}`,
        text: node.attrs.label,
        color: node.attrs.color || '#3b82f6',
        size: node.attrs.size || 'md',
      }]
    }
    // Default: return empty array
    return []
  }

  const [labels, setLabels] = useState<LabelItem[]>(getLabels)

  // Sync labels with node attrs
  useEffect(() => {
    setLabels(getLabels())
  }, [node.attrs.labels, node.attrs.label])

  // Helper to update labels - stringify before sending to TipTap
  const updateLabelsAttr = (newLabels: LabelItem[]) => {
    const jsonString = JSON.stringify(newLabels)
    console.log('[LabelNodeView] Updating labels:', jsonString)
    setLabels(newLabels)
    updateAttributes({ labels: jsonString })
  }

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

  const handleDeleteBlock = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleDeleteLabel = (labelId: string) => {
    const newLabels = labels.filter(l => l.id !== labelId)
    if (newLabels.length === 0) {
      // If no labels left, delete the entire block
      handleDeleteBlock()
    } else {
      updateLabelsAttr(newLabels)
    }
  }

  const handleAddLabel = () => {
    const newLabel: LabelItem = {
      id: `label-item-${Date.now()}`,
      text: 'Label',
      color: '#3b82f6',
      size: 'md',
    }
    const newLabels = [...labels, newLabel]
    updateLabelsAttr(newLabels)
    // Start editing the new label
    setEditingLabelId(newLabel.id)
    setEditingLabel(newLabel)
  }

  const handleStartEdit = (label: LabelItem) => {
    setEditingLabelId(label.id)
    setEditingLabel({ ...label })
  }

  const handleSaveEdit = () => {
    if (!editingLabel || !editingLabelId) return

    const newLabels = labels.map(l =>
      l.id === editingLabelId ? editingLabel : l
    )
    updateLabelsAttr(newLabels)
    setEditingLabelId(null)
    setEditingLabel(null)
  }

  const handleCancelEdit = () => {
    setEditingLabelId(null)
    setEditingLabel(null)
    setShowIconPicker(false)
  }

  const openIconPicker = () => {
    if (iconButtonRef.current) {
      const rect = iconButtonRef.current.getBoundingClientRect()
      setIconPickerPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      })
    }
    setShowIconPicker(true)
  }

  const handleIconSelect = (iconKey: string) => {
    if (editingLabel) {
      setEditingLabel({ ...editingLabel, icon: iconKey })
    }
    setShowIconPicker(false)
  }

  const handleRemoveIcon = () => {
    if (editingLabel) {
      setEditingLabel({ ...editingLabel, icon: undefined })
    }
    setShowIconPicker(false)
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

  const colors = {
    bg: theme === 'light' ? '#f9fafb' : '#1f2937',
    border: theme === 'light' ? '#e5e7eb' : '#374151',
    text: theme === 'light' ? '#111827' : '#f3f4f6',
    secondaryText: theme === 'light' ? '#6b7280' : '#9ca3af',
  }

  // Render editing form for a single label
  if (editingLabelId && editingLabel) {
    return (
      <NodeViewWrapper className="label-node-view">
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
            {/* Label Text */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Label Text *
              </label>
              <input
                type="text"
                value={editingLabel.text}
                onChange={(e) => setEditingLabel({ ...editingLabel, text: e.target.value })}
                placeholder="Label"
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: colors.text,
                }}
              />
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Color
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presetColors.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setEditingLabel({ ...editingLabel, color: preset.value })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      backgroundColor: preset.value,
                      border: editingLabel.color === preset.value ? '3px solid #000' : `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title={preset.name}
                  />
                ))}
                <input
                  type="color"
                  value={editingLabel.color}
                  onChange={(e) => setEditingLabel({ ...editingLabel, color: e.target.value })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                  }}
                  title="Custom color"
                />
              </div>
            </div>

            {/* Icon */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Icon (optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  ref={iconButtonRef}
                  onClick={openIconPicker}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: editingLabel.icon
                      ? `2px solid ${editingLabel.color}`
                      : `2px dashed ${colors.border}`,
                    backgroundColor: editingLabel.icon
                      ? editingLabel.color
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={editingLabel.icon ? 'Change icon' : 'Add icon'}
                >
                  {editingLabel.icon ? (
                    <IconRenderer
                      iconKey={editingLabel.icon}
                      style={{
                        fontSize: '20px',
                        width: '20px',
                        height: '20px',
                        color: '#ffffff',
                      }}
                    />
                  ) : (
                    <i
                      className="pi pi-plus"
                      style={{
                        fontSize: '16px',
                        color: colors.secondaryText,
                      }}
                    />
                  )}
                </button>
                {editingLabel.icon && (
                  <button
                    onClick={handleRemoveIcon}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme === 'light' ? '#fef2f2' : '#450a0a',
                      border: `1px solid ${theme === 'light' ? '#fecaca' : '#7f1d1d'}`,
                      borderRadius: '4px',
                      color: theme === 'light' ? '#dc2626' : '#fca5a5',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <i className="pi pi-trash" style={{ fontSize: '12px' }} />
                    Remove
                  </button>
                )}
              </div>
              <IconPicker
                selectedIcon={editingLabel.icon || ''}
                onSelectIcon={handleIconSelect}
                onRemoveIcon={handleRemoveIcon}
                showPicker={showIconPicker}
                onClosePicker={() => setShowIconPicker(false)}
                pickerPosition={iconPickerPosition}
                theme={theme}
                iconColor={editingLabel.color}
              />
            </div>

            {/* Size */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: colors.text }}>
                Size
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditingLabel({ ...editingLabel, size: s })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: editingLabel.size === s ? '#3b82f6' : (theme === 'light' ? '#f3f4f6' : '#374151'),
                      color: editingLabel.size === s ? '#ffffff' : colors.text,
                      border: editingLabel.size === s ? '2px solid #2563eb' : `1px solid ${colors.border}`,
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
                onClick={handleSaveEdit}
                disabled={!editingLabel.text}
                style={{
                  padding: '8px 16px',
                  backgroundColor: editingLabel.text ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: editingLabel.text ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
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

  // Render labels view
  return (
    <NodeViewWrapper className="label-node-view">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        {/* Delete block button */}
        {isEditable && (
          <button
            onClick={handleDeleteBlock}
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
            title="Delete label group"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        {/* Render each label */}
        {labels.map((label) => (
          <div
            key={label.id}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {/* Individual label delete button */}
            {isEditable && labels.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteLabel(label.id)
                }}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: theme === 'light' ? '#fee2e2' : '#7f1d1d',
                  border: `1px solid ${theme === 'light' ? '#fecaca' : '#991b1b'}`,
                  color: theme === 'light' ? '#ef4444' : '#fca5a5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
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
                title="Remove this label"
              >
                <i className="pi pi-times" style={{ fontSize: '8px' }}></i>
              </button>
            )}

            <div
              onClick={() => isEditable && handleStartEdit(label)}
              style={{
                cursor: isEditable ? 'pointer' : 'default',
              }}
            >
              <Label
                label={label.text}
                color={label.color}
                theme={theme}
                size={label.size}
                icon={label.icon}
              />
            </div>
          </div>
        ))}

        {/* Add label button */}
        {isEditable && (
          <button
            onClick={handleAddLabel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: `1px dashed ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.secondaryText,
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'all 0.2s',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.color = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = colors.secondaryText
            }}
            title="Add another label"
          >
            <i className="pi pi-plus" style={{ fontSize: '10px' }}></i>
            Add
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}
