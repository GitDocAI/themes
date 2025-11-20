import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition, useRef } from 'react'

export const TabsNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [_isPending, _startTransition] = useTransition()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [maxHeight, setMaxHeight] = useState<number>(0)
  const contentRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>('')
  const [showIconModal, setShowIconModal] = useState<boolean>(false)
  const [iconModalIndex, setIconModalIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabIndex !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingTabIndex])

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

  // Calculate max height from all tabs
  useEffect(() => {
    const calculateMaxHeight = () => {
      let max = 0
      contentRefs.current.forEach((ref) => {
        if (ref) {
          const height = ref.scrollHeight
          if (height > max) {
            max = height
          }
        }
      })
      // Set max height with a reasonable limit (e.g., 600px)
      setMaxHeight(Math.min(max, 600))
    }

    // Delay to ensure content is rendered
    const timeoutId = setTimeout(calculateMaxHeight, 100)

    // Re-calculate on content changes
    const observer = new MutationObserver(calculateMaxHeight)
    contentRefs.current.forEach((ref) => {
      if (ref) {
        observer.observe(ref, { childList: true, subtree: true })
      }
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [node.content])

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleAddTab = () => {
    if (!getPos) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    // Insert new tab at the end
    const endPos = pos + node.nodeSize - 1

    editor
      .chain()
      .focus()
      .insertContentAt(endPos, {
        type: 'tabBlock',
        attrs: {
          label: `Tab ${node.content.childCount + 1}`,
          icon: null,
          isActive: false,
        },
        content: [{ type: 'paragraph' }],
      })
      .run()
  }

  const handleTabClick = (index: number) => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    // Set all tabs to inactive, then activate the clicked one
    editor.commands.command(({ tr }) => {
      let currentPos = pos + 1

      node.content.forEach((child, _offset, idx) => {
        const childPos = currentPos
        const isCurrentTab = idx === index

        tr.setNodeMarkup(childPos, undefined, {
          ...child.attrs,
          isActive: isCurrentTab,
        })

        currentPos += child.nodeSize
      })

      return true
    })
  }

  const handleStartEditLabel = (index: number) => {
    setEditingTabIndex(index)
    setEditingLabel(node.content.child(index).attrs.label)
  }

  const handleSaveLabel = () => {
    if (editingTabIndex === null || !getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    if (editingLabel.trim() === '') {
      setEditingTabIndex(null)
      return
    }

    let currentPos = pos + 1
    for (let i = 0; i < editingTabIndex; i++) {
      currentPos += node.content.child(i).nodeSize
    }

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(currentPos, undefined, {
        ...node.content.child(editingTabIndex).attrs,
        label: editingLabel,
      })
      return true
    })

    setEditingTabIndex(null)
  }

  const handleCancelEdit = () => {
    setEditingTabIndex(null)
    setEditingLabel('')
  }

  const handleDeleteTab = (index: number) => {
    if (!getPos || !editor || node.content.childCount <= 1) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    let currentPos = pos + 1
    for (let i = 0; i < index; i++) {
      currentPos += node.content.child(i).nodeSize
    }

    const tabNode = node.content.child(index)
    editor.commands.deleteRange({ from: currentPos, to: currentPos + tabNode.nodeSize })
  }

  const handleOpenIconModal = (index: number) => {
    setIconModalIndex(index)
    setShowIconModal(true)
  }

  const handleSelectIcon = (iconClass: string | null) => {
    if (iconModalIndex === null || !getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    let currentPos = pos + 1
    for (let i = 0; i < iconModalIndex; i++) {
      currentPos += node.content.child(i).nodeSize
    }

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(currentPos, undefined, {
        ...node.content.child(iconModalIndex).attrs,
        icon: iconClass,
      })
      return true
    })

    setShowIconModal(false)
    setIconModalIndex(null)
  }

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (!getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        alignment,
      })
      return true
    })
  }

  const isEditable = editor.isEditable
  const alignment = node.attrs.alignment || 'left'
  const tabs: { label: string; icon: string | null; isActive: boolean }[] = []
  node.content.forEach((child) => {
    tabs.push({
      label: child.attrs.label || 'Tab',
      icon: child.attrs.icon || null,
      isActive: child.attrs.isActive || false,
    })
  })

  // Common PrimeIcons for the modal
  const commonIcons = [
    { class: null, label: 'No Icon' },
    { class: 'pi-home', label: 'Home' },
    { class: 'pi-star', label: 'Star' },
    { class: 'pi-heart', label: 'Heart' },
    { class: 'pi-check', label: 'Check' },
    { class: 'pi-times', label: 'Times' },
    { class: 'pi-search', label: 'Search' },
    { class: 'pi-user', label: 'User' },
    { class: 'pi-cog', label: 'Settings' },
    { class: 'pi-bell', label: 'Bell' },
    { class: 'pi-calendar', label: 'Calendar' },
    { class: 'pi-envelope', label: 'Envelope' },
    { class: 'pi-folder', label: 'Folder' },
    { class: 'pi-file', label: 'File' },
    { class: 'pi-database', label: 'Database' },
    { class: 'pi-chart-line', label: 'Chart' },
    { class: 'pi-lock', label: 'Lock' },
    { class: 'pi-unlock', label: 'Unlock' },
    { class: 'pi-book', label: 'Book' },
    { class: 'pi-bookmark', label: 'Bookmark' },
    { class: 'pi-code', label: 'Code' },
    { class: 'pi-cloud', label: 'Cloud' },
    { class: 'pi-download', label: 'Download' },
    { class: 'pi-upload', label: 'Upload' },
    { class: 'pi-image', label: 'Image' },
    { class: 'pi-pencil', label: 'Pencil' },
    { class: 'pi-trash', label: 'Trash' },
    { class: 'pi-tag', label: 'Tag' },
    { class: 'pi-flag', label: 'Flag' },
    { class: 'pi-info-circle', label: 'Info' },
    { class: 'pi-exclamation-triangle', label: 'Warning' },
    { class: 'pi-question-circle', label: 'Question' },
  ]

  return (
    <NodeViewWrapper className="tabs-node-view-wrapper" data-type="tabs-block">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Controls Bar - Only in edit mode */}
        {isEditable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
              border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              borderRadius: '6px 6px 0 0',
            }}
          >
            <button
              onClick={handleAddTab}
              style={{
                padding: '4px 10px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="pi pi-plus" style={{ fontSize: '10px' }}></i>
              Add Tab
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '8px',
            }}>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                marginRight: '4px',
              }}>
                Align:
              </span>
              <button
                onClick={() => handleAlignmentChange('left')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: alignment === 'left' ? '#3b82f6' : 'transparent',
                  color: alignment === 'left' ? 'white' : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Align left"
              >
                <i className="pi pi-align-left" style={{ fontSize: '10px' }}></i>
              </button>
              <button
                onClick={() => handleAlignmentChange('center')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: alignment === 'center' ? '#3b82f6' : 'transparent',
                  color: alignment === 'center' ? 'white' : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Align center"
              >
                <i className="pi pi-align-center" style={{ fontSize: '10px' }}></i>
              </button>
              <button
                onClick={() => handleAlignmentChange('right')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: alignment === 'right' ? '#3b82f6' : 'transparent',
                  color: alignment === 'right' ? 'white' : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Align right"
              >
                <i className="pi pi-align-right" style={{ fontSize: '10px' }}></i>
              </button>
            </div>

            <div style={{ flex: 1 }} />

            <button
              onClick={handleDelete}
              style={{
                padding: '4px 10px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <i className="pi pi-trash" style={{ fontSize: '10px' }}></i>
              Delete
            </button>
          </div>
        )}

        {/* Tab Headers with separator */}
        <div
          style={{
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            paddingTop: '12px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {tabs.map((tab, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                {editingTabIndex === index && isEditable ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveLabel()
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                    }}
                    onBlur={handleSaveLabel}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      width: `${Math.max(editingLabel.length * 8 + 32, 60)}px`,
                      minWidth: '60px',
                    }}
                  />
                ) : (
                  <button
                    onClick={() => handleTabClick(index)}
                    onDoubleClick={() => {
                      if (isEditable) {
                        handleStartEditLabel(index)
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: tab.isActive
                        ? theme === 'light'
                          ? '#3b82f6'
                          : '#60a5fa'
                        : theme === 'light'
                        ? '#6b7280'
                        : '#9ca3af',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: tab.isActive ? '600' : '400',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (!tab.isActive) {
                        e.currentTarget.style.color = theme === 'light' ? '#3b82f6' : '#60a5fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tab.isActive) {
                        e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
                      }
                    }}
                  >
                    {/* Icon area - left of text */}
                    {isEditable && (
                      <i
                        className={tab.icon ? `pi ${tab.icon}` : 'pi pi-plus-circle'}
                        style={{
                          fontSize: '14px',
                          cursor: 'pointer',
                          opacity: tab.icon ? 1 : 0.5,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenIconModal(index)
                        }}
                        title={tab.icon ? 'Change icon' : 'Add icon'}
                      ></i>
                    )}
                    {!isEditable && tab.icon && (
                      <i
                        className={`pi ${tab.icon}`}
                        style={{ fontSize: '14px' }}
                      ></i>
                    )}
                    {tab.label}
                  </button>
                )}

                {/* Active indicator */}
                {tab.isActive && (
                  <div
                    style={{
                      width: '100%',
                      height: '2px',
                      backgroundColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      marginTop: '8px',
                    }}
                  />
                )}
              </div>

              {/* Delete Tab Button - Only in edit mode */}
              {isEditable && node.content.childCount > 1 && (
                <i
                  className="pi pi-times"
                  onClick={() => handleDeleteTab(index)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '4px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#9ca3af' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme === 'light' ? '#ef4444' : '#f87171'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme === 'light' ? '#9ca3af' : '#6b7280'
                  }}
                  title="Delete tab"
                ></i>
              )}
            </div>
          ))}
          </div>

          {/* Separator Line */}
          <div
            style={{
              marginTop: '0px',
              height: '1px',
              backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
            }}
          />
        </div>

        {/* Tab Content */}
        <div
          style={{
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            minHeight: maxHeight > 0 ? `${maxHeight}px` : '200px',
            maxHeight: '600px',
            overflow: 'auto',
            position: 'relative',
            padding: '16px',
          }}
        >
          <NodeViewContent className="tabs-content-wrapper" />
        </div>
      </div>

      {/* Icon Selector Modal */}
      {showIconModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => {
            setShowIconModal(false)
            setIconModalIndex(null)
          }}
        >
          <div
            style={{
              backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '500px',
              maxHeight: '70vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: theme === 'light' ? '#1f2937' : '#f9fafb',
              }}
            >
              Select Icon
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              {commonIcons.map((icon) => (
                <button
                  key={icon.class || 'none'}
                  onClick={() => handleSelectIcon(icon.class)}
                  style={{
                    padding: '12px',
                    backgroundColor: theme === 'light' ? '#f9fafb' : '#111827',
                    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#eff6ff' : '#1e3a8a'
                    e.currentTarget.style.borderColor = theme === 'light' ? '#3b82f6' : '#60a5fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : '#111827'
                    e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
                  }}
                >
                  {icon.class ? (
                    <i
                      className={`pi ${icon.class}`}
                      style={{
                        fontSize: '20px',
                        color: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      }}
                    ></i>
                  ) : (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: theme === 'light' ? '#9ca3af' : '#6b7280',
                      }}
                    >
                      ×
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      color: theme === 'light' ? '#6b7280' : '#9ca3af',
                      textAlign: 'center',
                    }}
                  >
                    {icon.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowIconModal(false)
                setIconModalIndex(null)
              }}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '8px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  )
}
