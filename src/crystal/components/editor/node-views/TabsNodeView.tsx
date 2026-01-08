import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect,  useRef } from 'react'
import { IconPicker,IconRenderer } from '../../common/IconPicker'


export const TabsNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [maxHeight, setMaxHeight] = useState<number>(0)
  const contentRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>('')
  const [showIconPicker, setShowIconPicker] = useState<boolean>(false)
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null)
  const [iconPickerPosition, setIconPickerPosition] = useState({ top: 0, left: 0 });
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

  const openIconPicker = (index: number, target: EventTarget) => {
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      setIconPickerPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
      setIconPickerIndex(index);
      setShowIconPicker(true);
    }
  };

  const onSelectIcon = (iconKey: string) => {
    if (iconPickerIndex === null) return;
    updateTabIcon(iconPickerIndex, iconKey);
    setShowIconPicker(false);
    setIconPickerIndex(null);
  };

  const onRemoveIcon = () => {
    if (iconPickerIndex === null) return;
    updateTabIcon(iconPickerIndex, null);
    setShowIconPicker(false);
    setIconPickerIndex(null);
  };

  const updateTabIcon = (_index: number, icon: string | null) => {
    if (iconPickerIndex === null || !getPos || !editor) return
    const pos = getPos()
    if (typeof pos !== 'number') return

    let currentPos = pos + 1
    for (let i = 0; i < iconPickerIndex; i++) {
      currentPos += node.content.child(i).nodeSize
    }

    editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(currentPos, undefined, {
        ...node.content.child(iconPickerIndex).attrs,
        icon: icon,
      })
      return true
    })
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
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          openIconPicker(index, e.currentTarget)
                        }}
                        title={tab.icon ? 'Change icon' : 'Add icon'}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}
                      >
                        <IconRenderer
                          iconKey={tab.icon || 'pi pi-image'}
                          style={{
                            fontSize: '14px',
                            opacity: tab.icon ? 1 : 0.5,
                            color: tab.isActive
                              ? (theme === 'light' ? '#3b82f6' : '#60a5fa')
                              : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                          }}
                        />
                      </span>
                    )}
                    {!isEditable && tab.icon && (
                      <IconRenderer iconKey={tab.icon} style={{ fontSize: '14px' }} />
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

      {showIconPicker && (
          <IconPicker
            selectedIcon={iconPickerIndex !== null ? tabs[iconPickerIndex]?.icon||'' : ''}
            onSelectIcon={onSelectIcon}
            onRemoveIcon={onRemoveIcon}
            showPicker={showIconPicker}
            onClosePicker={() => setShowIconPicker(false)}
            pickerPosition={iconPickerPosition}
            theme={theme}
            iconColor={'#3b82f6'}
          />
      )}
    </NodeViewWrapper>
  )
}
