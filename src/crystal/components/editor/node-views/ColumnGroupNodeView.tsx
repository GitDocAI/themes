import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'

export const ColumnGroupNodeView = ({ node, editor, getPos, updateAttributes }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [columnCount, setColumnCount] = useState(node.attrs.columnCount || 2)
  const [showSelector, setShowSelector] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

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

  // Close selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as HTMLElement)) {
        setShowSelector(false)
      }
    }

    if (showSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSelector])

  // Sync column count from node attrs
  useEffect(() => {
    if (node.attrs.columnCount !== columnCount) {
      setColumnCount(node.attrs.columnCount)
    }
  }, [node.attrs.columnCount, columnCount])

  const handleColumnCountChange = (newCount: number) => {
    if (newCount < 2 || newCount > 3) return

    const currentColumnCount = node.childCount
    setColumnCount(newCount)
    updateAttributes({ columnCount: newCount })

    // Add or remove columns as needed
    if (editor && getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        if (newCount > currentColumnCount) {
          // Add a column
          editor.commands.command(({ tr }) => {
            const insertPos = pos + node.nodeSize - 1
            tr.insert(insertPos, editor.schema.nodes.column.create(null, [
              editor.schema.nodes.paragraph.create()
            ]))
            return true
          })
        } else if (newCount < currentColumnCount) {
          // Remove the last column
          editor.commands.command(({ tr }) => {
            let lastColumnPos = pos + 1
            let currentCol = 0
            node.forEach((_child, offset) => {
              if (currentCol === currentColumnCount - 1) {
                lastColumnPos = pos + offset + 1
              }
              currentCol++
            })
            tr.delete(lastColumnPos, lastColumnPos + node.lastChild!.nodeSize)
            return true
          })
        }
      }
    }

    setShowSelector(false)
  }

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const isEditable = editor.isEditable
  const textColor = theme === 'light' ? '#6b7280' : '#9ca3af'
  const buttonBg = theme === 'light' ? '#ffffff' : '#374151'
  const buttonBorder = theme === 'light' ? '#d1d5db' : '#4b5563'
  const dropdownBg = theme === 'light' ? '#ffffff' : '#1f2937'
  const dropdownBorder = theme === 'light' ? '#e5e7eb' : '#374151'

  if (isEditable) {
    // Dev mode - with column selector and delete button
    return (
      <NodeViewWrapper className="column-group-wrapper">
        <div
          style={{
            margin: '1rem 0',
            position: 'relative',
          }}
          data-column-group-content
        >
          {/* Controls - top right */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '0',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            {/* Column selector */}
            <div ref={selectorRef}>
              <button
                onClick={() => setShowSelector(!showSelector)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: buttonBg,
                  color: textColor,
                  border: `1px solid ${buttonBorder}`,
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#4b5563'
                  e.currentTarget.style.borderColor = '#60a5fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = buttonBg
                  e.currentTarget.style.borderColor = buttonBorder
                }}
                title="Change column count"
              >
                <i className="pi pi-table" style={{ fontSize: '10px' }}></i>
                {columnCount} columns
                <i className="pi pi-chevron-down" style={{ fontSize: '8px' }}></i>
              </button>

              {showSelector && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: '0',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorder}`,
                    borderRadius: '6px',
                    boxShadow: theme === 'light' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
                    minWidth: '120px',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}
                >
                  {[2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleColumnCountChange(count)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: columnCount === count
                          ? (theme === 'light' ? '#f3f4f6' : '#374151')
                          : 'transparent',
                        color: columnCount === count
                          ? '#60a5fa'
                          : (theme === 'light' ? '#374151' : '#d1d5db'),
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (columnCount !== count) {
                          e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                          e.currentTarget.style.color = theme === 'light' ? '#111827' : '#f3f4f6'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (columnCount !== count) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = theme === 'light' ? '#374151' : '#d1d5db'
                        }
                      }}
                    >
                      {columnCount === count && (
                        <i className="pi pi-check" style={{ fontSize: '10px' }}></i>
                      )}
                      {count} columns
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete button - small circle with X */}
            <button
              onClick={handleDelete}
              style={{
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#fecaca' : '#991b1b'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'light' ? '#fee2e2' : '#7f1d1d'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Delete column group"
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          </div>

          <NodeViewContent
            as="div"
            className="column-group-content-editable"
          />
        </div>
      </NodeViewWrapper>
    )
  }

  // Preview mode - no selector or delete button
  return (
    <NodeViewWrapper className="column-group-wrapper">
      <div
        style={{
          margin: '1rem 0',
        }}
        data-column-group-content
      >
        <NodeViewContent
          as="div"
          className="column-group-content-preview"
        />
      </div>
    </NodeViewWrapper>
  )
}
