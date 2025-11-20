import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition } from 'react'

export const AccordionTabNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(node.attrs.isActive || false)
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerValue, setHeaderValue] = useState(node.attrs.header || 'Tab')
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

  // Sync attrs
  useEffect(() => {
    setIsActive(node.attrs.isActive || false)
    setHeaderValue(node.attrs.header || 'Tab')
  }, [node.attrs])

  const handleToggle = () => {
    const newActive = !isActive

    // If activating this tab, need to check if we should deactivate others
    if (newActive && getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        // Find the parent accordion node
        const $pos = editor.state.doc.resolve(pos)
        const accordionPos = $pos.before($pos.depth)
        const accordionNode = editor.state.doc.nodeAt(accordionPos)

        if (accordionNode && accordionNode.type.name === 'accordionBlock') {
          const isMultiple = accordionNode.attrs.multiple

          if (!isMultiple) {
            // Deactivate all other tabs (except this one) and activate this one
            editor.commands.command(({ tr }) => {
              const tabPos = tr.doc.resolve(accordionPos + 1)
              let currentPos = tabPos.pos

              accordionNode.content.forEach((child, _offset, _index) => {
                const childPos = currentPos
                const isCurrentTab = childPos === pos

                if (isCurrentTab) {
                  // Activate this tab
                  tr.setNodeMarkup(childPos, undefined, {
                    ...child.attrs,
                    isActive: true,
                  })
                } else if (child.attrs.isActive) {
                  // Deactivate all other tabs
                  tr.setNodeMarkup(childPos, undefined, {
                    ...child.attrs,
                    isActive: false,
                  })
                }
                currentPos += child.nodeSize
              })

              return true
            })

            // Update local state
            setIsActive(true)
            return // Exit early, the transaction already handled everything
          }
        }
      }
    }

    setIsActive(newActive)

    startTransition(() => {
      updateAttributes({ isActive: newActive })
    })
  }

  const handleRemove = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleToggleDisabled = () => {
    startTransition(() => {
      updateAttributes({ disabled: !node.attrs.disabled })
    })
  }

  const saveHeader = () => {
    if (headerValue.trim()) {
      startTransition(() => {
        updateAttributes({ header: headerValue })
      })
    }
    setEditingHeader(false)
  }

  const isEditable = editor.isEditable
  const disabled = node.attrs.disabled || false

  return (
    <NodeViewWrapper
      as="div"
      data-type="accordion-tab"
      className="accordion-tab-wrapper"
      style={{
        backgroundColor: 'transparent',
        border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
        marginBottom: '0.5rem',
      }}
    >
      {/* Tab Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1rem 1.25rem',
          cursor: 'default',
          backgroundColor: isActive
            ? (theme === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.1)')
            : 'transparent',
          borderBottom: isActive ? `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}` : 'none',
        }}
      >
        {editingHeader && isEditable ? (
          <input
            type="text"
            value={headerValue}
            onChange={(e) => setHeaderValue(e.target.value)}
            onBlur={saveHeader}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveHeader()
              if (e.key === 'Escape') {
                setHeaderValue(node.attrs.header)
                setEditingHeader(false)
              }
            }}
            autoFocus
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '1.05rem',
              fontWeight: '600',
              backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
              color: theme === 'light' ? '#1a202c' : '#f1f5f9',
              border: `2px solid #3b82f6`,
              borderRadius: '4px',
              outline: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: '1.05rem',
              fontWeight: '600',
              color: isActive
                ? '#3b82f6'
                : (theme === 'light' ? '#1a202c' : '#f1f5f9'),
              cursor: isEditable ? 'text' : 'pointer',
            }}
            onClick={(e) => {
              if (isEditable) {
                // In edit mode, clicking name opens editor
                e.stopPropagation()
                setEditingHeader(true)
              } else if (!disabled) {
                // In view mode, clicking name toggles
                handleToggle()
              }
            }}
          >
            {headerValue}
          </span>
        )}

        {/* Chevron indicator - clickable to toggle */}
        <i
          className={`pi ${isActive ? 'pi-chevron-up' : 'pi-chevron-down'}`}
          style={{
            fontSize: '1rem',
            color: isActive ? '#3b82f6' : (theme === 'light' ? '#64748b' : '#94a3b8'),
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            padding: '4px',
          }}
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) {
              handleToggle()
            }
          }}
        ></i>

        {isEditable && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleToggleDisabled}
              style={{
                padding: '4px 8px',
                backgroundColor: disabled ? '#ef4444' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              title={disabled ? 'Enable' : 'Disable'}
            >
              <i className={`pi ${disabled ? 'pi-lock' : 'pi-lock-open'}`} style={{ fontSize: '10px' }}></i>
            </button>

            <button
              onClick={handleRemove}
              style={{
                padding: '4px 8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          </div>
        )}
      </div>

      {/* Tab Content - always rendered, visibility controlled by isActive */}
      <div
        style={{
          display: isActive ? 'block' : 'none',
          padding: '1.25rem',
          backgroundColor: 'transparent',
        }}
      >
        <NodeViewContent className="accordion-tab-content" />
      </div>
    </NodeViewWrapper>
  )
}
