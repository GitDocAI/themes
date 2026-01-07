import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useTransition } from 'react'

export const AccordionNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [_, startTransition] = useTransition()
  const [multiple, setMultiple] = useState<boolean>(node.attrs.multiple || false)
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

  // Sync multiple attribute
  useEffect(() => {
    setMultiple(node.attrs.multiple || false)
  }, [node.attrs.multiple])

  // Enforce single active tab when multiple is false
  useEffect(() => {
    if (!multiple && getPos && editor) {
      const pos = getPos()
      if (typeof pos !== 'number') return

      // Count how many tabs are active
      let activeCount = 0
      let firstActiveIndex = -1

      node.content.forEach((child, _offset, index) => {
        if (child.attrs.isActive) {
          activeCount++
          if (firstActiveIndex === -1) {
            firstActiveIndex = index
          }
        }
      })

      // If more than one tab is active, deactivate all except the first
      if (activeCount > 1) {
        editor.commands.command(({ tr }) => {
          const tabPos = tr.doc.resolve(pos + 1)
          let currentPos = tabPos.pos

          node.content.forEach((child, _offset, index) => {
            if (child.attrs.isActive && index !== firstActiveIndex) {
              tr.setNodeMarkup(currentPos, undefined, {
                ...child.attrs,
                isActive: false,
              })
            }
            currentPos += child.nodeSize
          })

          return true
        })
      }
    }
  }, [node.content, multiple, getPos, editor])

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleMultipleToggle = () => {
    const newMultiple = !multiple

    startTransition(() => {
      updateAttributes({ multiple: newMultiple })
    })
  }

  const addTab = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.command(({ tr }) => {
          const insertPos = pos + node.nodeSize - 1
          const newTab = editor.schema.nodes.accordionTab.create(
            { header: `Tab ${node.childCount + 1}`, disabled: false, isActive: false },
            [editor.schema.nodes.paragraph.create(null, [
              editor.schema.text(`Content ${node.childCount + 1}`)
            ])]
          )
          tr.insert(insertPos, newTab)
          return true
        })
      }
    }
  }

  const isEditable = editor.isEditable

  return (
    <NodeViewWrapper className="accordion-node-view-wrapper" data-type="accordion-block">
      <div
        style={{
          margin: '1rem 0',
          position: 'relative',
        }}
      >
        {/* Controls Bar - Always visible in edit mode */}
        {isEditable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              backgroundColor: theme === 'light' ? '#f9fafb' : '#1f2937',
              border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
              borderRadius: '6px',
              marginBottom: '0.5rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
              <input
                type="checkbox"
                checked={multiple}
                onChange={handleMultipleToggle}
                style={{ cursor: 'pointer' }}
              />
              <span>Multiple</span>
            </label>

            <div style={{ flex: 1 }} />

            <button
              onClick={addTab}
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

        {/* Render all accordion tabs - CSS will handle visibility */}
        <NodeViewContent
          as="div"
          className="accordion-content-wrapper"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        />
      </div>
    </NodeViewWrapper>
  )
}
