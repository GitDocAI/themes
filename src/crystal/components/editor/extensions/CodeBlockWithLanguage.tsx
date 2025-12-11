import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useState, useRef, useEffect } from 'react'
import { codeToHtml } from 'shiki'

const lowlight = createLowlight(common)

const CodeBlockComponent = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(node.attrs.language || 'javascript')
  const selectorRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)
  const [showCopyButton, setShowCopyButton] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>('')

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

  // Generate syntax highlighted code for preview mode
  useEffect(() => {
    if (!isEditable && codeRef.current) {
      const generateHighlight = async () => {
        const codeContent = codeRef.current?.textContent || ''
        if (codeContent.trim()) {
          try {
            const html = await codeToHtml(codeContent, {
              lang: selectedLanguage,
              theme: theme === 'dark' ? 'tokyo-night' : 'github-light',
            })
            setHighlightedCode(html)
          } catch (error) {
            console.error(`Error highlighting ${selectedLanguage}:`, error)
            setHighlightedCode('')
          }
        }
      }
      generateHighlight()
    }
  }, [isEditable, selectedLanguage, theme, codeRef.current?.textContent])

  const handleCopy = async () => {
    if (codeRef.current) {
      const codeText = codeRef.current.textContent || ''
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
            margin: '1rem 0',
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
              borderRadius: '8px',
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
              borderRadius: '8px 8px 0 0',
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
            borderRadius: '0 0 8px 8px',
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

  // Preview mode - with copy button on hover
  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div
        style={{
          position: 'relative',
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          overflow: 'visible',
          margin: '1rem 0',
          backgroundColor: codeBg,
        }}
        onMouseEnter={() => setShowCopyButton(true)}
        onMouseLeave={() => setShowCopyButton(false)}
      >
        {/* Copy button - appears on hover */}
        {showCopyButton && (
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 6px',
              backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(55, 65, 81, 0.9)',
              color: theme === 'light' ? '#374151' : '#e5e7eb',
              border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
              zIndex: 10,
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(243, 244, 246, 0.95)' : 'rgba(75, 85, 99, 0.95)'
              e.currentTarget.style.borderColor = '#60a5fa'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(55, 65, 81, 0.9)'
              e.currentTarget.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563'
            }}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            <i className={copied ? 'pi pi-check' : 'pi pi-copy'} style={{ fontSize: '11px' }}></i>
          </button>
        )}

        {/* Hidden element to extract text content */}
        <div style={{ display: 'none' }}>
          <pre ref={codeRef}>
            <NodeViewContent as={'code' as any} />
          </pre>
        </div>

        {/* Visible highlighted code or fallback */}
        {highlightedCode ? (
          <div
            className="code-block-syntax-highlight"
            style={{
              margin: 0,
              borderRadius: '8px',
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        ) : (
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: codeBg,
              color: codeColor,
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
