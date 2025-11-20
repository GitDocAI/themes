import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition } from 'react'
import { configLoader } from '../../../services/configLoader'

const ICON_CATEGORIES = {
  Popular: [
    { icon: 'pi pi-bolt', name: 'Bolt' },
    { icon: 'pi pi-star', name: 'Star' },
    { icon: 'pi pi-heart', name: 'Heart' },
    { icon: 'pi pi-check', name: 'Check' },
    { icon: 'pi pi-info-circle', name: 'Info' },
    { icon: 'pi pi-exclamation-triangle', name: 'Warning' },
  ],
  Technology: [
    { icon: 'pi pi-code', name: 'Code' },
    { icon: 'pi pi-database', name: 'Database' },
    { icon: 'pi pi-server', name: 'Server' },
    { icon: 'pi pi-desktop', name: 'Desktop' },
    { icon: 'pi pi-mobile', name: 'Mobile' },
    { icon: 'pi pi-cloud', name: 'Cloud' },
  ],
  Business: [
    { icon: 'pi pi-briefcase', name: 'Briefcase' },
    { icon: 'pi pi-chart-line', name: 'Chart' },
    { icon: 'pi pi-shopping-cart', name: 'Cart' },
    { icon: 'pi pi-dollar', name: 'Dollar' },
    { icon: 'pi pi-calendar', name: 'Calendar' },
    { icon: 'pi pi-clock', name: 'Clock' },
  ],
  Communication: [
    { icon: 'pi pi-envelope', name: 'Email' },
    { icon: 'pi pi-comment', name: 'Comment' },
    { icon: 'pi pi-bell', name: 'Bell' },
    { icon: 'pi pi-phone', name: 'Phone' },
    { icon: 'pi pi-send', name: 'Send' },
    { icon: 'pi pi-inbox', name: 'Inbox' },
  ],
}

export const CardNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(node.attrs.title || '')
  const [icon, setIcon] = useState(node.attrs.icon || '')
  const [iconAlign, setIconAlign] = useState<'left' | 'center' | 'right'>(node.attrs.iconAlign || 'left')
  const [href, setHref] = useState(node.attrs.href || '')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [iconColor, setIconColor] = useState('#3b82f6')

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

      // Get primary color from config for the current theme
      const primaryColor = configLoader.getPrimaryColor(currentTheme)
      setIconColor(primaryColor)
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
    setShowIconPicker(false)

    // Use startTransition to mark Tiptap updates as non-urgent transitions
    // This prevents React 19's flushSync warnings by allowing interruption
    startTransition(() => {
      updateAttributes({
        title,
        icon,
        iconAlign,
        href,
      })
    })
  }

  const handleCancel = () => {
    setTitle(node.attrs.title || '')
    setIcon(node.attrs.icon || '')
    setIconAlign(node.attrs.iconAlign || 'left')
    setHref(node.attrs.href || '')
    setIsEditing(false)
    setShowIconPicker(false)
  }

  const handleIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon)
    setShowIconPicker(false)
  }

  const isEditable = editor.isEditable

  if (isEditing) {
    return (
      <NodeViewWrapper className="card-node-view">
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
              title="Delete card"
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
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {/* Title */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title"
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

            {/* Content - Editable markdown area */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Content (supports markdown)
              </label>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px',
                minHeight: '100px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                color: theme === 'light' ? '#111827' : '#f3f4f6',
              }}>
                <NodeViewContent />
              </div>
            </div>

            {/* Icon Selector */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Icon (optional)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                  }}
                >
                  {icon ? <i className={icon} style={{ fontSize: '18px' }}></i> : <i className="pi pi-plus"></i>}
                  <span>{icon ? 'Change Icon' : 'Select Icon'}</span>
                </button>
                {icon && (
                  <button
                    type="button"
                    onClick={() => setIcon('')}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <i className="pi pi-times"></i>
                  </button>
                )}
              </div>

              {/* Icon Picker Modal */}
              {showIconPicker && (
                <div
                  style={{
                    marginTop: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                    <div key={category} style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                        {category}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                        {icons.map(({ icon: iconClass, name }) => (
                          <button
                            key={iconClass}
                            type="button"
                            onClick={() => handleIconSelect(iconClass)}
                            style={{
                              padding: '12px',
                              backgroundColor: icon === iconClass ? '#3b82f6' : (theme === 'light' ? '#f3f4f6' : '#374151'),
                              border: icon === iconClass ? '2px solid #2563eb' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (icon !== iconClass) {
                                e.currentTarget.style.backgroundColor = theme === 'light' ? '#e5e7eb' : '#4b5563'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (icon !== iconClass) {
                                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                              }
                            }}
                            title={name}
                          >
                            <i className={iconClass} style={{ fontSize: '20px', color: icon === iconClass ? '#ffffff' : (theme === 'light' ? '#111827' : '#f3f4f6') }}></i>
                            <span style={{ fontSize: '9px', textAlign: 'center', color: icon === iconClass ? '#ffffff' : (theme === 'light' ? '#6b7280' : '#9ca3af') }}>
                              {name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Icon Alignment */}
            {icon && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                  Icon Alignment
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setIconAlign(align)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: iconAlign === align ? iconColor : (theme === 'light' ? '#f3f4f6' : '#374151'),
                        color: iconAlign === align ? '#ffffff' : (theme === 'light' ? '#111827' : '#f3f4f6'),
                        border: iconAlign === align ? `2px solid ${iconColor}` : '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                      }}
                    >
                      {align}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: theme === 'light' ? '#6b7280' : '#9ca3af', marginTop: '4px', marginBottom: 0 }}>
                  Icon color is configured globally in gitdocai.config.json
                </p>
              </div>
            )}

            {/* Link */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                Link URL (optional)
              </label>
              <input
                type="text"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://example.com"
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

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSave}
                disabled={!title}
                style={{
                  padding: '8px 16px',
                  backgroundColor: title ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: title ? 'pointer' : 'not-allowed',
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
    <NodeViewWrapper className="card-node-view">
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
            title="Delete card"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        <div
          onClick={() => {
            if (isEditable) {
              setIsEditing(true)
            } else if (href) {
              window.open(href, '_blank', 'noopener,noreferrer')
            }
          }}
          style={{
            position: 'relative',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: isEditable ? 'pointer' : (href ? 'pointer' : 'default'),
            transition: 'all 0.15s ease',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (isEditable || href) {
              e.currentTarget.style.borderColor = (!isEditable && href) ? iconColor : (theme === 'light' ? '#d1d5db' : '#4b5563')
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              // Show link indicator only in non-editable mode with href
              if (!isEditable && href) {
                const linkIndicator = e.currentTarget.querySelector('.link-indicator') as HTMLElement
                if (linkIndicator) {
                  linkIndicator.style.opacity = '1'
                  linkIndicator.style.transform = 'scale(1)'
                }
              }
            }
          }}
          onMouseLeave={(e) => {
            if (isEditable || href) {
              e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
              e.currentTarget.style.boxShadow = 'none'
              // Hide link indicator
              if (!isEditable && href) {
                const linkIndicator = e.currentTarget.querySelector('.link-indicator') as HTMLElement
                if (linkIndicator) {
                  linkIndicator.style.opacity = '0'
                  linkIndicator.style.transform = 'scale(0.9)'
                }
              }
            }
          }}
        >
          {/* Content Body */}
          <div style={{ padding: '1.5rem' }}>
            {/* Icon and Title Row */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1rem',
              justifyContent: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'flex-end' : 'flex-start',
              flexDirection: iconAlign === 'center' ? 'column' : iconAlign === 'right' ? 'row-reverse' : 'row',
            }}>
              {icon && (
                <i className={icon} style={{ fontSize: '2.5rem', color: iconColor, transition: 'transform 0.3s ease' }} />
              )}
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: theme === 'light' ? '#111827' : '#f3f4f6',
                textAlign: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'right' : 'left',
              }}>
                {title || 'Untitled Card'}
              </h3>
            </div>

            {/* Card Content */}
            <div style={{ fontSize: '0.95rem', color: theme === 'light' ? '#475569' : '#cbd5e1', lineHeight: '1.6' }}>
              <NodeViewContent />
            </div>
          </div>

          {/* Link indicator (same as Card component) */}
          {href && (
            <div
              className="link-indicator"
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(31, 41, 55, 0.95)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${iconColor}`,
                borderRadius: '50%',
                opacity: 0,
                transform: 'scale(0.9)',
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
                boxShadow: theme === 'light' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              <i className="pi pi-arrow-right" style={{ fontSize: '0.9rem', color: iconColor }}></i>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
