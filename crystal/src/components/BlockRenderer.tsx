import type { Block } from '../services/pageLoader'

interface BlockRendererProps {
  block: Block
  theme: 'light' | 'dark'
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block, theme }) => {
  const textColor = theme === 'light' ? '#111827' : '#f9fafb'
  const secondaryTextColor = theme === 'light' ? '#374151' : '#d1d5db'
  const borderColor = theme === 'light' ? '#e5e7eb' : '#4b5563'
  const blockquoteBg = theme === 'light' ? '#f3f4f6' : '#1f2937'

  // Helper function to render markdown-style text (bold, italic)
  const renderText = (text: string) => {
    // Replace ***bold italic*** with <strong><em>
    let result = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Replace **bold** with <strong>
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Replace *italic* with <em>
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>')
    return result
  }

  switch (block.type) {
    case 'h1':
      return (
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
            marginTop: '0px',
            color: textColor,
            lineHeight: '1.2',
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: renderText(block.content || '') }}
        />
      )

    case 'h2':
      return (
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            marginTop: '28px',
            color: textColor,
            lineHeight: '1.3',
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: renderText(block.content || '') }}
        />
      )

    case 'h3':
      return (
        <h3
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '16px',
            marginTop: '24px',
            color: textColor,
            lineHeight: '1.4',
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: renderText(block.content || '') }}
        />
      )

    case 'paragraph':
      return (
        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            marginBottom: '16px',
            color: secondaryTextColor,
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: renderText(block.content || '') }}
        />
      )

    case 'blockquote':
      // Remove the '>' character if it exists
      const quoteContent = block.content?.replace(/^>\s*/, '') || ''
      return (
        <blockquote
          style={{
            borderLeft: `4px solid ${borderColor}`,
            paddingLeft: '16px',
            marginLeft: '0',
            marginBottom: '16px',
            backgroundColor: blockquoteBg,
            padding: '12px 16px',
            borderRadius: '4px',
            fontStyle: 'italic',
            color: secondaryTextColor,
            textAlign: 'left'
          }}
          dangerouslySetInnerHTML={{ __html: renderText(quoteContent) }}
        />
      )

    case 'bullet-list':
      return (
        <ul
          style={{
            listStyle: 'disc',
            paddingLeft: '24px',
            marginBottom: '16px',
            color: secondaryTextColor,
            textAlign: 'left'
          }}
        >
          {block.items?.map((item, idx) => {
            // Remove leading '* ' if it exists
            const cleanItem = item.replace(/^\*\s*/, '')
            return (
              <li
                key={idx}
                style={{
                  marginBottom: '8px',
                  lineHeight: '1.75',
                  textAlign: 'left'
                }}
                dangerouslySetInnerHTML={{ __html: renderText(cleanItem) }}
              />
            )
          })}
        </ul>
      )

    case 'numbered-list':
      return (
        <ol
          style={{
            listStyle: 'decimal',
            paddingLeft: '24px',
            marginBottom: '16px',
            color: secondaryTextColor,
            textAlign: 'left'
          }}
        >
          {block.items?.map((item, idx) => {
            // Remove leading number and dot if it exists (e.g., "1. ")
            const cleanItem = item.replace(/^\d+\.\s*/, '')
            return (
              <li
                key={idx}
                style={{
                  marginBottom: '8px',
                  lineHeight: '1.75',
                  textAlign: 'left'
                }}
                dangerouslySetInnerHTML={{ __html: renderText(cleanItem) }}
              />
            )
          })}
        </ol>
      )

    case 'separator':
      return (
        <hr
          style={{
            border: 'none',
            borderTop: `1px solid ${borderColor}`,
            marginTop: '32px',
            marginBottom: '32px'
          }}
        />
      )

    case 'code':
      return (
        <pre
          style={{
            backgroundColor: theme === 'light' ? '#1e1e1e' : '#0d1117',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            marginBottom: '16px',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
        >
          <code>{block.code || ''}</code>
        </pre>
      )

    case 'card':
      return (
        <div
          style={{
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '16px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937'
          }}
        >
          {block.title && (
            <h4
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '12px',
                color: textColor
              }}
            >
              {block.title}
            </h4>
          )}
          {block.content && (
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.75',
                color: secondaryTextColor,
                margin: 0
              }}
              dangerouslySetInnerHTML={{ __html: renderText(block.content) }}
            />
          )}
        </div>
      )

    case 'codegroup':
      // For preview, just show all code snippets stacked
      return (
        <div style={{ marginBottom: '16px' }}>
          {block.snippets?.map((snippet: any, idx: number) => (
            <div key={idx} style={{ marginBottom: idx < (block.snippets?.length ?? 0) - 1 ? '8px' : '0' }}>
              {snippet.label && (
                <div
                  style={{
                    backgroundColor: theme === 'light' ? '#e5e7eb' : '#374151',
                    color: textColor,
                    padding: '8px 12px',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {snippet.label}
                </div>
              )}
              <pre
                style={{
                  backgroundColor: theme === 'light' ? '#1e1e1e' : '#0d1117',
                  color: '#d4d4d4',
                  padding: '16px',
                  borderRadius: snippet.label ? '0 0 8px 8px' : '8px',
                  overflow: 'auto',
                  margin: 0,
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}
              >
                <code>{snippet.code || ''}</code>
              </pre>
            </div>
          ))}
        </div>
      )

    case 'info':
      const infoTypes: Record<string, { bg: string; border: string; icon: string }> = {
        info: {
          bg: theme === 'light' ? '#dbeafe' : '#1e3a8a',
          border: theme === 'light' ? '#3b82f6' : '#60a5fa',
          icon: 'ℹ️'
        },
        warning: {
          bg: theme === 'light' ? '#fef3c7' : '#78350f',
          border: theme === 'light' ? '#f59e0b' : '#fbbf24',
          icon: '⚠️'
        },
        error: {
          bg: theme === 'light' ? '#fee2e2' : '#7f1d1d',
          border: theme === 'light' ? '#ef4444' : '#f87171',
          icon: '❌'
        },
        success: {
          bg: theme === 'light' ? '#dcfce7' : '#14532d',
          border: theme === 'light' ? '#22c55e' : '#4ade80',
          icon: '✅'
        }
      }
      const infoType = infoTypes[block.variant || 'info'] || infoTypes.info
      return (
        <div
          style={{
            backgroundColor: infoType.bg,
            borderLeft: `4px solid ${infoType.border}`,
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem' }}>{infoType.icon}</span>
            <div style={{ flex: 1 }}>
              {block.title && (
                <div
                  style={{
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: textColor
                  }}
                >
                  {block.title}
                </div>
              )}
              {block.content && (
                <div
                  style={{
                    color: secondaryTextColor
                  }}
                  dangerouslySetInnerHTML={{ __html: renderText(block.content) }}
                />
              )}
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div style={{ padding: '10px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '16px' }}>
          Unknown block type: {block.type}
        </div>
      )
  }
}
