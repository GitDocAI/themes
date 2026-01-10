import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect } from 'react'

export const InfoBlockNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const type = node.attrs.type || 'info'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

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

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const getTypeConfig = (infoType: string) => {
    switch (infoType) {
      case 'tip':
        return {
          icon: 'pi pi-lightbulb',
          color: 'rgb(74, 222, 128)', // green-400
          textColor: 'rgba(180, 230, 180, 0.7)', // muted green
          bgColor: 'rgba(34, 197, 94, 0.1)', // green-500/10
          borderColor: 'rgba(34, 197, 94, 0.3)', // green-500/30
        }
      case 'note':
        return {
          icon: 'pi pi-pencil',
          color: 'rgb(96, 165, 250)', // blue-400
          textColor: 'rgba(170, 200, 255, 0.7)', // muted blue
          bgColor: 'rgba(59, 130, 246, 0.1)', // blue-500/10
          borderColor: 'rgba(59, 130, 246, 0.3)', // blue-500/30
        }
      case 'warning':
        return {
          icon: 'pi pi-exclamation-triangle',
          color: 'rgb(250, 204, 21)', // yellow-400
          textColor: 'rgba(255, 230, 150, 0.7)', // muted yellow
          bgColor: 'rgba(234, 179, 8, 0.1)', // yellow-500/10
          borderColor: 'rgba(234, 179, 8, 0.3)', // yellow-500/30
        }
      case 'danger':
        return {
          icon: 'pi pi-times-circle',
          color: 'rgb(248, 113, 113)', // red-400
          textColor: 'rgba(255, 180, 180, 0.7)', // muted red
          bgColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
          borderColor: 'rgba(239, 68, 68, 0.3)', // red-500/30
        }
      default: // info
        return {
          icon: 'pi pi-info-circle',
          color: 'rgb(56, 189, 248)', // sky-400
          textColor: 'rgba(170, 220, 255, 0.7)', // muted sky
          bgColor: 'rgba(14, 165, 233, 0.1)', // sky-500/10
          borderColor: 'rgba(14, 165, 233, 0.3)', // sky-500/30
        }
    }
  }

  const typeConfig = getTypeConfig(type)
  const isEditable = editor.isEditable

  return (
    <NodeViewWrapper className="info-node-view">
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
            title="Delete info block"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>
        )}

        <style>{`
          .info-block-content-${type} {
            color: ${theme === 'light' ? '#1f2937' : typeConfig.textColor};
          }
          .info-block-content-${type} strong,
          .info-block-content-${type} b,
          .info-block-content-${type} h1,
          .info-block-content-${type} h2,
          .info-block-content-${type} h3,
          .info-block-content-${type} h4,
          .info-block-content-${type} h5,
          .info-block-content-${type} h6 {
            color: ${theme === 'light' ? '#1f2937' : '#ffffff'};
          }
        `}</style>
        <div
          style={{
            display: 'flex',
            alignItems: 'start',
            gap: '1rem',
            borderRadius: '16px',
            border: `1px solid ${typeConfig.borderColor}`,
            padding: '1rem',
            backgroundColor: typeConfig.bgColor,
          }}
        >
          <i
            className={typeConfig.icon}
            style={{
              marginTop: '0.125rem',
              fontSize: '1.25rem',
              color: typeConfig.color,
              flexShrink: 0,
            }}
          />

          <div
            style={{
              width: '100%',
            }}
          >
            <NodeViewContent
              className={`info-block-content info-block-content-${type}`}
              style={{
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
