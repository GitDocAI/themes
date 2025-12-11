import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'

interface DragHandleMenuProps {
  editor: Editor
  theme: 'light' | 'dark'
}

export const DragHandleMenu: React.FC<DragHandleMenuProps> = ({ editor, theme }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [, setDraggedNode] = useState<{ pos: number; node: any } | null>(null)
  const [isHoveringHandle, setIsHoveringHandle] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) return

      const target = e.target as HTMLElement

      // Check if hovering over the drag handle itself
      if (target.closest('.drag-handle-button')) {
        setIsHoveringHandle(true)
        return
      }

      setIsHoveringHandle(false)

      const editorElement = target.closest('.tiptap-editor')
      if (!editorElement) {
        setPosition(null)
        return
      }

      // Find the closest block element
      const blockElement = target.closest('h1, h2, h3, p, ul, ol, blockquote, pre, hr, [data-type="cardBlock"], [data-type="codeGroupBlock"], [data-type="infoBlock"]')

      if (blockElement && blockElement instanceof HTMLElement) {
        const rect = blockElement.getBoundingClientRect()
        const editorRect = editorElement.getBoundingClientRect()

        setPosition({
          top: rect.top + rect.height / 2,
          left: editorRect.left - 32,
        })
      } else if (!isHoveringHandle) {
        setPosition(null)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [isDragging, isHoveringHandle])

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)

    // Get the current node position
    const { state } = editor
    const { from } = state.selection

    // Find the node at cursor position
    let nodePos = from
    let node = state.doc.nodeAt(from)

    state.doc.descendants((n, pos) => {
      const nodeRect = editor.view.domAtPos(pos).node as HTMLElement
      if (nodeRect && nodeRect.getBoundingClientRect) {
        const rect = nodeRect.getBoundingClientRect()
        if (position && Math.abs(rect.top + rect.height / 2 - position.top) < 5) {
          node = n
          nodePos = pos
          return false
        }
      }
    })

    if (node) {
      setDraggedNode({ pos: nodePos, node })
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', node.textContent || '')
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedNode(null)
  }

  if (!position) return null

  return (
    <>
      {/* Invisible hover area to keep handle visible */}
      <div
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left - 10}px`,
          transform: 'translateY(-50%)',
          width: '50px',
          height: '40px',
          zIndex: 999,
        }}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
      />

      {/* Drag handle button */}
      <div
        className="drag-handle-button"
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateY(-50%)',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
          borderRadius: '4px',
          color: theme === 'light' ? '#6b7280' : '#9ca3af',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          setIsHoveringHandle(true)
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.color = '#3b82f6'
          e.currentTarget.style.backgroundColor = theme === 'light' ? '#eff6ff' : '#1e3a8a'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme === 'light' ? '#e5e7eb' : '#374151'
          e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
          e.currentTarget.style.backgroundColor = theme === 'light' ? '#ffffff' : '#1f2937'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      </div>
    </>
  )
}
