import React from 'react'
import { TiptapEditor } from './editor/TiptapEditor'

interface RightPanelProps {
  theme: 'light' | 'dark'
  content: any // Tiptap JSON content from the right panel node
  isDevMode?: boolean
}

export const RightPanel: React.FC<RightPanelProps> = ({ theme, content, isDevMode = false }) => {

  // The content is the rightPanel node itself, we need to wrap its content in a doc
  const editorContent = content?.content ? {
    type: 'doc',
    content: content.content
  } : { type: 'doc', content: [] }


  return (
    <div
      style={{
        width: '100%',
        paddingLeft: '24px',
        fontSize: '13px',
        color: theme === 'light' ? '#4b5563' : '#9ca3af',
        marginBottom: '1rem',
      }}
    >
      {/* Dev mode indicator */}
      {isDevMode && (
        <div
          style={{
            backgroundColor: theme === 'light' ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${theme === 'light' ? '#60a5fa' : '#3b82f6'}`,
            borderRadius: '6px',
            padding: '6px 8px',
            marginBottom: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: theme === 'light' ? '#1e40af' : '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <i className="pi pi-bars" style={{ fontSize: '10px' }}></i>
          Right Panel (Live Preview)
        </div>
      )}

      {/* Use TiptapEditor in read-only mode to render all content including custom components */}
      <div
        style={{
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        <TiptapEditor
          content={editorContent}
          theme={theme}
          onUpdate={() => {}}
          editable={false}
          minHeight="auto"
        />
      </div>
    </div>
  )
}
