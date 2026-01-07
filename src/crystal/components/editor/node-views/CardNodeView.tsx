import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { configLoader } from '../../../../services/configLoader'

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
  const [_, startTransition] = useTransition()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(node.attrs.title || '')
  const [icon, setIcon] = useState(node.attrs.icon || '')
  const [iconAlign, setIconAlign] = useState<'left' | 'center' | 'right'>(node.attrs.iconAlign || 'left')
  const [href, setHref] = useState(node.attrs.href || '')
  const [showInlineIconPicker, setShowInlineIconPicker] = useState(false)
  const [iconPickerPosition, setIconPickerPosition] = useState({ top: 0, left: 0 })
  const inlineIconPickerRef = useRef<HTMLDivElement>(null)
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

      // Get primary color from config for the current theme
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
      // Move cursor to end instead of selecting all
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  // Close inline icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inlineIconPickerRef.current && !inlineIconPickerRef.current.contains(event.target as Node)) {
        setShowInlineIconPicker(false)
      }
    }

    if (showInlineIconPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showInlineIconPicker])

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
            position: 'relative',
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: !isEditable && href ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          }}
          onClick={() => {
            if (!isEditable && href) {
              window.open(href, '_blank', 'noopener,noreferrer')
            }
          }}
          onMouseEnter={(e) => {
            if (!isEditable && href) {
              e.currentTarget.style.borderColor = iconColor
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              const linkIndicator = e.currentTarget.querySelector('.link-indicator') as HTMLElement
              if (linkIndicator) {
                linkIndicator.style.opacity = '1'
                linkIndicator.style.transform = 'scale(1)'
              }
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditable && href) {
              e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
              e.currentTarget.style.boxShadow = 'none'
              const linkIndicator = e.currentTarget.querySelector('.link-indicator') as HTMLElement
              if (linkIndicator) {
                linkIndicator.style.opacity = '0'
                linkIndicator.style.transform = 'scale(0.9)'
              }
            }
          }}
        >
          {/* Settings Header - Only in edit mode */}
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
              {/* Icon Alignment */}
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
                      transition: 'all 0.15s',
                    }}
                    title={`Align ${align}`}
                  >
                    <i className={`pi pi-align-${align}`} style={{ fontSize: '12px' }}></i>
                  </button>
                ))}
              </div>

              {/* Link URL Input */}
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
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Content Body */}
          <div style={{ padding: '1.5rem' }}>
            {/* Icon and Title Row */}
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
              {/* Icon or placeholder */}
              <div ref={iconButtonRef} style={{ position: 'relative' }}>
                {icon ? (
                  <div
                    onMouseDown={(e) => {
                      if (isEditable) {
                        e.stopPropagation()
                        e.preventDefault()
                        if (showInlineIconPicker) {
                          setShowInlineIconPicker(false)
                        } else {
                          openInlineIconPicker()
                        }
                      }
                    }}
                    style={{
                      cursor: isEditable ? 'pointer' : 'default',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (isEditable) {
                        e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isEditable) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                    title={isEditable ? 'Click to change icon' : ''}
                  >
                    <i className={icon} style={{ fontSize: '2.5rem', color: iconColor, transition: 'transform 0.3s ease' }} />
                  </div>
                ) : isEditable ? (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (showInlineIconPicker) {
                        setShowInlineIconPicker(false)
                      } else {
                        openInlineIconPicker()
                      }
                    }}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '8px',
                      border: `2px dashed ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = iconColor
                      e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Click to add icon"
                  >
                    <i className="pi pi-plus" style={{ fontSize: '1rem', color: theme === 'light' ? '#9ca3af' : '#6b7280' }} />
                  </div>
                ) : null}
              </div>

              {/* Inline Icon Picker - Portal */}
              {showInlineIconPicker && isEditable && createPortal(
                <div
                  ref={inlineIconPickerRef}
                  style={{
                    position: 'absolute',
                    top: iconPickerPosition.top,
                    left: iconPickerPosition.left,
                    zIndex: 10000,
                    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '280px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Remove icon button */}
                  {icon && (
                    <button
                      type="button"
                      onClick={() => {
                        handleRemoveIcon()
                        setShowInlineIconPicker(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '12px',
                        backgroundColor: theme === 'light' ? '#fef2f2' : '#450a0a',
                        border: `1px solid ${theme === 'light' ? '#fecaca' : '#7f1d1d'}`,
                        borderRadius: '6px',
                        color: theme === 'light' ? '#dc2626' : '#fca5a5',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="pi pi-trash" style={{ fontSize: '12px' }}></i>
                      Remove Icon
                    </button>
                  )}

                  {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                    <div key={category} style={{ marginBottom: '10px' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '600', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                        {category}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {icons.map(({ icon: iconClass, name }) => (
                          <button
                            key={iconClass}
                            type="button"
                            onClick={() => handleInlineIconSelect(iconClass)}
                            style={{
                              padding: '8px',
                              backgroundColor: icon === iconClass ? iconColor : (theme === 'light' ? '#f3f4f6' : '#374151'),
                              border: icon === iconClass ? `2px solid ${iconColor}` : `1px solid ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            title={name}
                          >
                            <i className={iconClass} style={{ fontSize: '18px', color: icon === iconClass ? '#ffffff' : (theme === 'light' ? '#111827' : '#f3f4f6') }}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>,
                document.body
              )}

              {/* Inline Title Editing */}
              {isEditable && isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                    textAlign: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'right' : 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${iconColor}`,
                    outline: 'none',
                    flex: 1,
                    minWidth: 0,
                    padding: '2px 0',
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
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: theme === 'light' ? '#111827' : '#f3f4f6',
                    textAlign: iconAlign === 'center' ? 'center' : iconAlign === 'right' ? 'right' : 'left',
                    cursor: isEditable ? 'text' : 'default',
                    flex: 1,
                    minWidth: 0,
                    padding: '2px 0',
                    borderBottom: isEditable ? `2px solid transparent` : 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (isEditable) {
                      e.currentTarget.style.borderBottomColor = theme === 'light' ? '#e5e7eb' : '#374151'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isEditable) {
                      e.currentTarget.style.borderBottomColor = 'transparent'
                    }
                  }}
                  title={isEditable ? 'Click to edit title' : ''}
                >
                  {title || 'Untitled Card'}
                </h3>
              )}
            </div>

            {/* Card Content - Always editable inline */}
            <div
              style={{
                fontSize: '0.95rem',
                color: theme === 'light' ? '#475569' : '#cbd5e1',
                lineHeight: '1.6',
                cursor: isEditable ? 'text' : 'default',
              }}
              onClick={(e) => {
                if (isEditable) {
                  e.stopPropagation()
                }
              }}
            >
              <NodeViewContent />
            </div>
          </div>

          {/* Link indicator */}
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
