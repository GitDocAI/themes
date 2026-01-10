import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef, useTransition } from 'react'
import { configLoader } from '../../../../services/configLoader'
import { IconPicker,IconRenderer } from '../../common/IconPicker'


export const CardNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_, startTransition] = useTransition()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(node.attrs.title || '')
  const [icon, setIcon] = useState(node.attrs.icon || '')
  const [iconAlign, setIconAlign] = useState<'left' | 'center' | 'right'>(node.attrs.iconAlign || 'left')
  const [href, setHref] = useState(node.attrs.href || '')
  const [showInlineIconPicker, setShowInlineIconPicker] = useState(false)
  const [iconPickerPosition, setIconPickerPosition] = useState({ top: 0, left: 0 })
  const iconButtonRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [iconColor, setIconColor] = useState('#3b82f6')
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Detect theme from document and get icon color from config
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
      const primaryColor = configLoader.getPrimaryColor(currentTheme)
      setIconColor(primaryColor)
    }

    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  const handleInlineIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon)
    setShowInlineIconPicker(false)
    startTransition(() => {
      updateAttributes({ icon: selectedIcon })
    })
  }

  const openInlineIconPicker = () => {
    if (iconButtonRef.current) {
      const rect = iconButtonRef.current.getBoundingClientRect()
      setIconPickerPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      })
    }
    setShowInlineIconPicker(true)
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
    setIsEditingTitle(false)
    startTransition(() => {
      updateAttributes({ title })
    })
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitle(node.attrs.title || '')
      setIsEditingTitle(false)
    }
  }

  const handleIconAlignChange = (align: 'left' | 'center' | 'right') => {
    setIconAlign(align)
    startTransition(() => {
      updateAttributes({ iconAlign: align })
    })
  }

  const handleHrefChange = (newHref: string) => {
    setHref(newHref)
    startTransition(() => {
      updateAttributes({ href: newHref })
    })
  }

  const handleRemoveIcon = () => {
    setIcon('')
    startTransition(() => {
      updateAttributes({ icon: '' })
    })
  }

  const isEditable = editor.isEditable


  return (
    <NodeViewWrapper className="card-node-view">
      <div
        style={{
          position: 'relative',
        }}
      >
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
            title="Delete card"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}


        <div
          style={{
            position: 'relative',
            border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '16px',
            overflow: 'hidden',
            cursor: !isEditable && href ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (href && !isEditable) {
              e.currentTarget.style.borderColor = iconColor
            }
          }}
          onMouseLeave={(e) => {
            if (href && !isEditable) {
              e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }
          }}
          onClick={() => {
            if (!isEditable && href) {
              window.open(href, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          {isEditable && (
            <div
              contentEditable={false}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '8px 12px',
                borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: theme === 'light' ? '#6b7280' : '#9ca3af', marginRight: '4px' }}>
                  Align:
                </span>
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => handleIconAlignChange(align)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: iconAlign === align ? iconColor : 'transparent',
                      color: iconAlign === align ? '#ffffff' : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                      border: iconAlign === align ? 'none' : `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                    title={`Align ${align}`}
                  >
                    <i className={`pi pi-align-${align}`} style={{ fontSize: '12px' }}></i>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '250px' }}>
                <i className="pi pi-link" style={{ fontSize: '12px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}></i>
                <input
                  type="text"
                  value={href}
                  onChange={(e) => handleHrefChange(e.target.value)}
                  placeholder="https://example.com"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ padding: '1.5rem' }}>
            <div
              contentEditable={false}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginBottom: '1rem',
                justifyContent: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'flex-end' : 'flex-start',
                flexDirection: iconAlign === 'center' ? 'column' : iconAlign === 'right' ? 'row-reverse' : 'row',
              }}
            >
              <div ref={iconButtonRef} style={{ position: 'relative', flexShrink: 0 }}>
                {icon ? (
                  <div
                    onMouseDown={(e) => {
                      if (isEditable) {
                        e.stopPropagation()
                        e.preventDefault()
                        openInlineIconPicker()
                      }
                    }}
                    style={{
                      cursor: isEditable ? 'pointer' : 'default',
                      borderRadius: '6px',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                    title={isEditable ? 'Click to change icon' : ''}
                  >
                    <IconRenderer iconKey={icon} style={{ fontSize: '1.75rem', color: iconColor, width: '28px', height: '28px', maxWidth: '28px', maxHeight: '28px' }} />
                  </div>
                ) : isEditable ? (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      openInlineIconPicker()
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      border: `2px dashed ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Click to add icon"
                  >
                    <i className="pi pi-plus" style={{ fontSize: '0.875rem', color: theme === 'light' ? '#9ca3af' : '#6b7280' }} />
                  </div>
                ) : null}
              </div>

              {showInlineIconPicker && isEditable && (
                <IconPicker
                  selectedIcon={icon}
                  onSelectIcon={handleInlineIconSelect}
                  onRemoveIcon={handleRemoveIcon}
                  showPicker={showInlineIconPicker}
                  onClosePicker={() => setShowInlineIconPicker(false)}
                  pickerPosition={iconPickerPosition}
                  theme={theme}
                  iconColor={iconColor}
                />
              )}

              {isEditable && isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    margin: 0, fontSize: '1.125rem', fontWeight: '600',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                    textAlign: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'right' : 'left',
                    backgroundColor: 'transparent', border: 'none',
                    borderBottom: `2px solid ${iconColor}`, outline: 'none', flex: 1, minWidth: 0, padding: '2px 0',
                  }}
                  placeholder="Card title"
                />
              ) : (
                <h3
                  onMouseDown={(e) => {
                    if (isEditable) {
                      e.stopPropagation()
                      e.preventDefault()
                      setIsEditingTitle(true)
                    }
                  }}
                  style={{
                    margin: 0, fontSize: '1.125rem', fontWeight: '600',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                    textAlign: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'right' : 'left',
                    cursor: isEditable ? 'text' : 'default', flex: 1, minWidth: 0,
                    padding: '2px 0', borderBottom: isEditable ? `2px solid transparent` : 'none',
                  }}
                  title={isEditable ? 'Click to edit title' : ''}
                >
                  {title || 'Untitled Card'}
                </h3>
              )}
            </div>

            <div
              style={{
                fontSize: '0.95rem',
                color: theme === 'light' ? '#475569' : '#cbd5e1',
                lineHeight: '1.6',
                cursor: isEditable ? 'text' : 'default',
              }}
              onClick={(e) => { if (isEditable) { e.stopPropagation() } }}
            >
              <NodeViewContent />
            </div>
          </div>

        </div>
      </div>
    </NodeViewWrapper>
  )
}
