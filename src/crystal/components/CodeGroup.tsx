import React, { useState, useEffect, useMemo } from 'react'
import { codeToHtml } from 'shiki'
import { configLoader } from '../../services/configLoader'

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

const extractText = (node: React.ReactNode): string => {
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
  const [copied, setCopied] = useState(false)
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')

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

  // Load primary color from config
  useEffect(() => {
    const color = configLoader.getPrimaryColor(theme)
    if (color) {
      setPrimaryColor(color)
    }
  }, [theme])

  useEffect(() => {
    const parsedFiles: CodeFile[] = []

    React.Children.forEach(children, (child: any) => {
      if (!React.isValidElement(child)) return

      const props = child.props as CodeTabProps

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
            let html = await codeToHtml(file.code, {
              lang: file.language,
              themes: {
                light: 'github-light-default',
                dark: 'dark-plus',
              },
              defaultColor: false,
            })
            // Replace the dark background with custom color
            html = html.replace('--shiki-dark-bg:#1E1E1E', '--shiki-dark-bg:#0B0C0E')
            return html
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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (files.length === 0 || highlightedCode.length === 0) {
    return null
  }

  // Colors based on theme
  const outerBg = theme === 'dark' ? '#131722' : '#f3f4f6'
  const innerBg = theme === 'dark' ? '#0a0f1c' : '#ffffff'
  const borderColor = theme === 'light' ? '#d1d5db' : '#1e293b'
  const textSecondary = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'


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
          background-color: var(${theme === 'dark' ? '--shiki-dark-bg' : '--shiki-light-bg'}) !important;
          margin: 0 !important;
        }
        .${containerId}-content .shiki span {
          color: var(${theme === 'dark' ? '--shiki-dark' : '--shiki-light'}) !important;
          background-color: transparent !important;
        }
        .${containerId}-content pre {
          margin: 0 !important;
          padding: 16px !important;
          border-radius: 12px !important;
          overflow-x: auto !important;
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
          padding: '4px',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          backgroundColor: outerBg,
        }}
      >
        {/* Tabs header */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Tabs container with scroll */}
          <div style={{
            display: 'flex',
            gap: '4px',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            flex: 1,
            alignItems: 'center',
            maskImage: 'linear-gradient(to right, black calc(100% - 50px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 50px), transparent 100%)',
            paddingRight: '40px',
          }}>
            {files.map((file, index) => (
              <button
                key={index}
                style={{
                  padding: '8px 10px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  fontSize: '13px',
                  letterSpacing: '-0.02em',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: index === activeIndex ? primaryColor : textSecondary,
                  textDecoration: index === activeIndex ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                  outline: 'none',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex(index)
                }}
              >
                {file.filename}
              </button>
            ))}
          </div>

          {/* Copy button - fixed position */}
          <div style={{ flexShrink: 0, backgroundColor: outerBg, zIndex: 30, display: 'flex', alignItems: 'center' }}>
            <button
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: textSecondary,
                outline: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              onMouseEnter={() => setShowCopyTooltip(true)}
              onMouseLeave={() => setShowCopyTooltip(false)}
            >
              {copied ? (
                <i className="pi pi-check" style={{ fontSize: '18px' }}></i>
              ) : (
                <svg
                  style={{ width: '18px', height: '18px' }}
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
              )}
            </button>
            {showCopyTooltip && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: '0',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </div>
            )}
          </div>
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
