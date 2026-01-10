import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useState, useRef, useEffect } from 'react'
import { codeToHtml } from 'shiki'
import { configLoader } from '../../../../services/configLoader'

const lowlight = createLowlight(common)

const CodeBlockComponent = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(node.attrs.language || 'javascript')
  const selectorRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [copied, setCopied] = useState(false)
  const [showCopyButton, setShowCopyButton] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'go',
    'rust',
    'swift',
    'kotlin',
    'sql',
    'html',
    'css',
    'scss',
    'json',
    'yaml',
    'xml',
    'markdown',
    'bash',
    'shell',
    'plaintext',
  ]

  // Sync language from node attrs
  useEffect(() => {
    if (node.attrs.language && node.attrs.language !== selectedLanguage) {
      setSelectedLanguage(node.attrs.language)
    }
  }, [node.attrs.language, selectedLanguage])

  // Detect theme from document
  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      // Parse RGB values
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])

        // Calculate luminance to determine if dark or light
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        const isDark = luminance < 0.5

        setTheme(isDark ? 'dark' : 'light')
      } else {
        // Default to dark
        setTheme('dark')
      }
    }

    detectTheme()
    // Re-detect on changes
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  // Load primary color from config
  useEffect(() => {
    const color = configLoader.getPrimaryColor(theme)
    if (color) {
      setPrimaryColor(color)
    }
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as HTMLElement)) {
        setShowLanguageSelector(false)
      }
    }

    if (showLanguageSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageSelector])

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    updateAttributes({ language })
    setShowLanguageSelector(false)
    // Clear any text selection that might occur
    setTimeout(() => {
      window.getSelection()?.removeAllRanges()
    }, 0)
  }

  const isEditable = editor.isEditable

  // Get code content directly from node
  const nodeTextContent = node.textContent || ''

  // Generate syntax highlighted code for preview mode using dual themes
  useEffect(() => {
    if (!isEditable && nodeTextContent.trim()) {
      const generateHighlight = async () => {
        try {
          let html = await codeToHtml(nodeTextContent, {
            lang: selectedLanguage,
            themes: {
              light: 'github-light-default',
              dark: 'dark-plus',
            },
            defaultColor: false,
          })
          // Replace the dark background with custom color
          html = html.replace('--shiki-dark-bg:#1E1E1E', '--shiki-dark-bg:#0B0C0E')
          setHighlightedCode(html)
        } catch (error) {
          console.error(`Error highlighting ${selectedLanguage}:`, error)
          setHighlightedCode('')
        }
      }
      generateHighlight()
    }
  }, [isEditable, nodeTextContent, selectedLanguage, theme])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(nodeTextContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const bgColor = theme === 'light' ? '#f3f4f6' : '#0f172a'
  const headerBg = theme === 'light' ? '#e5e7eb' : '#0a0f1c'
  const borderColor = theme === 'light' ? '#d1d5db' : '#1e293b'
  const textColor = theme === 'light' ? '#374151' : '#9ca3af'
  const dropdownBg = theme === 'light' ? '#ffffff' : '#1e293b'
  const dropdownBorder = theme === 'light' ? '#d1d5db' : '#334155'
  const codeBg = theme === 'light' ? '#f9fafb' : '#0a0f1c'
  const codeColor = theme === 'light' ? '#1f2937' : '#f9fafb'

  if (isEditable) {
    // Dev mode - with header and styled card
    return (
      <NodeViewWrapper className="code-block-wrapper">
        <div
          style={{
            margin: '20px 0 32px 0',
            position: 'relative',
          }}
        >
          {/* Delete button - top right corner */}
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
            title="Delete code block"
          >
            <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
          </button>

          <div
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: '16px',
              overflow: 'visible',
              backgroundColor: bgColor,
            }}
          >
            {/* Header with language selector */}
            <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              backgroundColor: headerBg,
              borderBottom: `1px solid ${borderColor}`,
              borderRadius: '16px 16px 0 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i
                className="pi pi-code"
                style={{ fontSize: '14px', color: textColor }}
              ></i>
              <span
                style={{
                  fontSize: '13px',
                  color: textColor,
                  fontWeight: '500',
                }}
              >
                Code Block
              </span>
            </div>

            {/* Language selector */}
            <div style={{ position: 'relative' }} ref={selectorRef}>
              <button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                  color: theme === 'light' ? '#374151' : '#e5e7eb',
                  border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontWeight: '500',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#4b5563'
                  e.currentTarget.style.borderColor = '#60a5fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#ffffff' : '#374151'
                  e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
                }}
              >
                <span>{selectedLanguage}</span>
                <i
                  className="pi pi-chevron-down"
                  style={{ fontSize: '10px' }}
                ></i>
              </button>

              {/* Language dropdown */}
              {showLanguageSelector && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: '0',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorder}`,
                    borderRadius: '8px',
                    boxShadow: theme === 'light' ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 10px 25px rgba(0, 0, 0, 0.5)',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    zIndex: 10000,
                    minWidth: '180px',
                  }}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: selectedLanguage === lang
                          ? (theme === 'light' ? '#f3f4f6' : '#374151')
                          : 'transparent',
                        color: selectedLanguage === lang
                          ? '#60a5fa'
                          : (theme === 'light' ? '#374151' : '#d1d5db'),
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedLanguage !== lang) {
                          e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                          e.currentTarget.style.color = theme === 'light' ? '#111827' : '#f3f4f6'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedLanguage !== lang) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = theme === 'light' ? '#374151' : '#d1d5db'
                        }
                      }}
                    >
                      {selectedLanguage === lang && (
                        <i
                          className="pi pi-check"
                          style={{ fontSize: '12px' }}
                        ></i>
                      )}
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code content */}
          <pre style={{
            margin: 0,
            padding: '1rem',
            borderRadius: '0 0 16px 16px',
            backgroundColor: codeBg,
            color: codeColor,
          }}>
            <NodeViewContent as={'code' as any} />
          </pre>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  // Preview mode - with fixed copy button
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div
        style={{
          position: 'relative',
          border: `1px solid ${borderColor}`,
          borderRadius: '16px',
          overflow: 'hidden',
          margin: '20px 0 32px 0',
        }}
      >
        {/* Fade gradient on top right corner */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '80px',
            height: '40px',
            background: `linear-gradient(to left, ${theme === 'dark' ? '#0B0C0E' : '#ffffff'} 40%, transparent 100%)`,
            zIndex: 5,
            pointerEvents: 'none',
            borderRadius: '0 16px 0 0',
          }}
        />

        {/* Copy button - always visible */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
          <button
            onClick={handleCopy}
            onMouseEnter={() => setShowCopyTooltip(true)}
            onMouseLeave={() => setShowCopyTooltip(false)}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
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
          {/* Tooltip */}
          {showCopyTooltip && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '-8px',
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: primaryColor,
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </div>
          )}
        </div>

        {/* Visible highlighted code or fallback - Shiki handles all styling */}
        {highlightedCode ? (
          <>
            <style>{`
              .shiki-code-container .shiki {
                background-color: var(${theme === 'dark' ? '--shiki-dark-bg' : '--shiki-light-bg'}) !important;
                margin: 0 !important;
                padding: 0.75rem 1rem !important;
                border-radius: 16px !important;
              }
              .shiki-code-container .shiki span {
                color: var(${theme === 'dark' ? '--shiki-dark' : '--shiki-light'}) !important;
                background-color: transparent !important;
              }
            `}</style>
            <div
              className="shiki-code-container"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </>
        ) : (
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              borderRadius: '16px',
              backgroundColor: codeBg,
              color: codeColor,
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'pre',
            }}
          >
            <NodeViewContent as={'code' as any} />
          </pre>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const CodeBlockWithLanguage = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      language: {
        default: 'javascript',
        parseHTML: (element) => element.getAttribute('data-language'),
        renderHTML: (attributes) => ({
          'data-language': attributes.language,
          class: `language-${attributes.language}`,
        }),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent)
  },
}).configure({
  lowlight,
})
