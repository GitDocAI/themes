import React, { useState, useEffect, useMemo } from 'react'
import { codeToHtml } from 'shiki'

interface CodeFile {
  filename: string
  code: string
  language: string
}

interface CodeGroupProps {
  children: React.ReactNode
  dropdown?: boolean
  theme?: 'light' | 'dark'
  title?: string
  onTitleChange?: (title: string) => void
  editable?: boolean
}

interface CodeTabProps {
  name?: string
  title?: string
  lang: string
  code?: string
  children?: string | React.ReactNode
}

const extractText = (node: any): string => {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children)
  }
  return ''
}

export const CodeGroup: React.FC<CodeGroupProps> = ({
  children,
  dropdown = false,
  theme: propTheme,
}) => {

  const [files, setFiles] = useState<CodeFile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [highlightedCode, setHighlightedCode] = useState<string[]>([])

  // Auto-detect theme if not provided
  const [autoTheme, setAutoTheme] = useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    if (!propTheme) {
      const detectTheme = () => {
        const bgColor = window.getComputedStyle(document.body).backgroundColor
        const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1])
          const g = parseInt(rgbMatch[2])
          const b = parseInt(rgbMatch[3])
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          setAutoTheme(luminance < 0.5 ? 'dark' : 'light')
        }
      }
      detectTheme()
      const observer = new MutationObserver(detectTheme)
      observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
      return () => observer.disconnect()
    }
  }, [propTheme])

  const theme = propTheme || autoTheme

  useEffect(() => {
    const parsedFiles: CodeFile[] = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return

      const props = child.props as any

      if (props.lang) {
        const filename = dropdown
          ? (props.title || props.name || `code.${props.lang}`)
          : (props.name || props.title || `code.${props.lang}`)

        const language = props.lang
        let code = (props.code || extractText(props.children)).trim()

        if (code.startsWith('`') && code.endsWith('`')) {
          code = code.slice(1, -1).trim()
        }

        if (code) {
          parsedFiles.push({ filename, code, language })
        }
      }
    })

    setFiles(parsedFiles)
  }, [children, dropdown])

  useEffect(() => {
    const highlightAll = async () => {
      const highlighted = await Promise.all(
        files.map(async (file) => {
          try {
            const html = await codeToHtml(file.code, {
              lang: file.language,
              theme: theme === 'dark' ? 'tokyo-night' : 'github-light',
            })

            // Remove inline background-color from the generated HTML
            // This is a workaround to ensure our CSS takes precedence
            const cleanedHtml = html
              .replace(/style="[^"]*background-color:[^";]*;?[^"]*"/g, (match) => {
                // Keep other styles but remove background-color
                const cleaned = match.replace(/background-color:[^";]+;?/g, '')
                return cleaned
              })
              .replace(/style=""/g, '') // Remove empty style attributes

            return cleanedHtml
          } catch (error) {
            console.error(`Error highlighting ${file.language}:`, error)
            return `<pre><code>${file.code}</code></pre>`
          }
        })
      )
      setHighlightedCode(highlighted)
    }

    if (files.length > 0) {
      highlightAll()
    }
  }, [files, theme])

  // Generate unique ID for this component instance (must be before early returns)
  const containerId = useMemo(() => `codegroup-${Math.random().toString(36).substring(2, 11)}`, [])

  const handleCopy = async () => {
    if (files[activeIndex]) {
      await navigator.clipboard.writeText(files[activeIndex].code)
    }
  }

  if (files.length === 0 || highlightedCode.length === 0) {
    return null
  }

  // Colors based on theme
  const outerBg = theme === 'dark' ? '#131722' : '#f3f4f6'
  const innerBg = theme === 'dark' ? '#0a0f1c' : '#ffffff'
  const borderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'
  const textSecondary = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
  const primaryColor = '#3b82f6'


  return (
    <>
      <style>{`
        .${containerId} ::selection {
          background-color: #3b82f6 !important;
          color: ${theme === 'dark' ? '#ffffff' : '#1e293b'} !important;
        }
        .${containerId} *::selection {
          background-color: #3b82f6 !important;
          color: ${theme === 'dark' ? '#ffffff' : '#1e293b'} !important;
        }
        .${containerId}-content .shiki,
        .${containerId}-content pre.shiki {
          background-color: ${innerBg} !important;
          background: ${innerBg} !important;
        }
        .${containerId}-content pre {
          margin: 0 !important;
          padding: 16px !important;
          border-radius: 12px !important;
          overflow-x: auto !important;
          background-color: ${innerBg} !important;
          background: ${innerBg} !important;
          scrollbar-color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)'} !important;
          scrollbar-width: thin !important;
        }
        .${containerId}-content pre code {
          background-color: transparent !important;
          background: transparent !important;
        }
        .${containerId}-content pre code span {
          background-color: transparent !important;
          background: transparent !important;
        }
        .${containerId}-content pre::-webkit-scrollbar {
          height: 8px !important;
        }
        .${containerId}-content pre::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} !important;
          border-radius: 4px !important;
        }
        .${containerId}-content pre::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} !important;
          border-radius: 4px !important;
        }
        .${containerId}-content pre::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} !important;
        }
        .${containerId}-content::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        .${containerId}-content::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} !important;
          border-radius: 4px !important;
        }
        .${containerId}-content::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} !important;
          border-radius: 4px !important;
        }
        .${containerId}-content::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} !important;
        }
      `}</style>
      <div
        className={containerId}
        style={{
          margin: '20px 0',
          padding: '16px 4px',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          backgroundColor: outerBg,
        }}
      >
        {/* Tabs header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {/* Tabs */}
          {files.map((file, index) => (
            <button
              key={index}
              style={{
                padding: '12px',
                fontFamily: 'monospace',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: index === activeIndex ? primaryColor : textSecondary,
                textDecoration: index === activeIndex ? 'underline' : 'none',
                textUnderlineOffset: '8px',
                outline: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex(index)
              }}
            >
              {file.filename}
            </button>
          ))}

          {/* Copy button */}
          <button
            style={{
              marginLeft: 'auto',
              marginTop: 'auto',
              marginBottom: 'auto',
              padding: '8px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0)',
              color: textSecondary,
              outline: 'none',
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0)'
            }}
            title="Copy code"
          >
            <svg
              style={{ width: '12px', height: '12px' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {/* Code content */}
        <div
          className={`${containerId}-content`}
          style={{
            backgroundColor: innerBg,
            borderRadius: '12px',
            padding: '16px',
            maxHeight: '80vh',
            overflowY: 'auto',
            userSelect: 'text'
          }}
          dangerouslySetInnerHTML={{ __html: highlightedCode[activeIndex] }}
        />
      </div>
    </>
  )
}

export const CodeTab: React.FC<CodeTabProps> = ({ children }) => {
  return <>{children}</>
}
