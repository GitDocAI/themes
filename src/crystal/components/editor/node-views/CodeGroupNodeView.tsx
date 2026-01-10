import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'
import { codeToHtml } from 'shiki'
import { configLoader } from '../../../../services/configLoader'

interface CodeFile {
  filename: string
  language: string
  code: string
}

export const CodeGroupNodeView = ({ node, updateAttributes, editor, getPos }: NodeViewProps) => {
  const [files, setFiles] = useState<CodeFile[]>(
    node.attrs.files || [{ filename: 'example.js', language: 'javascript', code: '' }]
  )
  const [activeTab, setActiveTab] = useState(0)
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null)
  const [editingFilename, setEditingFilename] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const filenameInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)
  const codeRef = useRef<HTMLElement>(null)
  const [highlightedCode, setHighlightedCode] = useState<string[]>([])
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')

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

  // Sync files from node attrs when they change externally
  useEffect(() => {
    const nodeFilesStr = JSON.stringify(node.attrs.files)
    const currentFilesStr = JSON.stringify(files)

    if (node.attrs.files && nodeFilesStr !== currentFilesStr) {
      setFiles(node.attrs.files)
    }
  }, [node.attrs.files])

  // Detect theme from document
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

      // Load primary color from config
      const color = configLoader.getPrimaryColor(currentTheme)
      if (color) {
        setPrimaryColor(color)
      }
    }

    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  // Close language selector when clicking outside
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

  // Focus filename input when editing
  useEffect(() => {
    if (editingTabIndex !== null && filenameInputRef.current) {
      filenameInputRef.current.focus()
      filenameInputRef.current.select()
    }
  }, [editingTabIndex])

  const isEditable = editor.isEditable

  // Generate syntax highlighted code for preview mode
  useEffect(() => {
    if (!isEditable && files.length > 0) {
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

      highlightAll()
    }
  }, [files, theme, isEditable])

  const updateFiles = (newFiles: CodeFile[]) => {
    setFiles(newFiles)
    // Update attributes - this triggers onTransaction event
    updateAttributes({ files: newFiles })
  }

  const handleAddFile = () => {
    const newFiles = [...files, { filename: 'newfile.js', language: 'javascript', code: '' }]
    updateFiles(newFiles)
    setActiveTab(newFiles.length - 1)
  }

  const handleRemoveFile = (index: number) => {
    if (files.length === 1) return // Don't remove the last file
    const newFiles = files.filter((_, i) => i !== index)
    updateFiles(newFiles)
    if (activeTab >= newFiles.length) {
      setActiveTab(newFiles.length - 1)
    }
  }

  const handleCodeChange = (index: number, code: string) => {
    const newFiles = [...files]
    newFiles[index].code = code
    updateFiles(newFiles)
  }

  const handleLanguageChange = (index: number, language: string) => {
    const newFiles = [...files]
    newFiles[index].language = language
    updateFiles(newFiles)
    setShowLanguageSelector(false)
    // Clear any text selection that might occur
    setTimeout(() => {
      window.getSelection()?.removeAllRanges()
    }, 0)
  }

  const handleStartEditFilename = (index: number) => {
    setEditingTabIndex(index)
    setEditingFilename(files[index].filename)
  }

  const handleSaveFilename = () => {
    if (editingTabIndex !== null && editingFilename.trim()) {
      const newFiles = [...files]
      newFiles[editingTabIndex].filename = editingFilename.trim()
      updateFiles(newFiles)
    }
    setEditingTabIndex(null)
  }

  const handleCancelEditFilename = () => {
    setEditingTabIndex(null)
    setEditingFilename('')
  }

  const handleTabChange = (index: number) => {
    setActiveTab(index)
    // Clear any text selection that might occur
    setTimeout(() => {
      window.getSelection()?.removeAllRanges()
    }, 0)
  }

  const handleCopy = async () => {
    // Get the raw code from the files array instead of the DOM
    const codeText = files[activeTab]?.code || ''
    if (codeText) {
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

  // Colors matching the new CodeGroup design
  const outerBg = theme === 'dark' ? '#131722' : '#f3f4f6'
  const innerBg = theme === 'dark' ? '#0a0f1c' : '#ffffff'
  const borderColor = theme === 'light' ? '#d1d5db' : '#1e293b'
  const textSecondary = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'

  // Legacy color mappings (keep for compatibility)
  const bgColor = outerBg
  const headerBg = outerBg
  const textColor = textSecondary
  const activeTextColor = primaryColor
  const dropdownBg = theme === 'light' ? '#ffffff' : '#1e293b'
  const dropdownBorder = borderColor
  const codeBg = innerBg
  const codeColor = theme === 'light' ? '#1f2937' : '#f9fafb'

  if (isEditable) {
    // Dev mode - with tabs and editable filenames
    return (
      <NodeViewWrapper className="code-group-wrapper">
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
              title="Delete code group"
            >
              <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
            </button>
          )}

          <div
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              overflow: 'visible',
              backgroundColor: bgColor,
            }}
          >
          {/* Header with tabs and language selector */}
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
            {/* Left side - Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                overflowX: 'auto',
              }}
            >
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    paddingBottom: '6px',
                    backgroundColor: 'transparent',
                    color: activeTab === index ? activeTextColor : textColor,
                    borderBottom: `2px solid ${activeTab === index ? activeTextColor : 'transparent'}`,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s ease',
                    fontWeight: activeTab === index ? '600' : '400',
                  }}
                  onClick={() => !editingTabIndex && handleTabChange(index)}
                  onMouseEnter={(e) => {
                    if (activeTab !== index && !editingTabIndex) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== index && !editingTabIndex) {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {editingTabIndex === index ? (
                    <input
                      ref={filenameInputRef}
                      type="text"
                      value={editingFilename}
                      onChange={(e) => setEditingFilename(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFilename()
                        if (e.key === 'Escape') handleCancelEditFilename()
                      }}
                      onBlur={handleSaveFilename}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        outline: 'none',
                        width: '120px',
                      }}
                    />
                  ) : (
                    <>
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          handleStartEditFilename(index)
                        }}
                        style={{ userSelect: 'none' }}
                      >
                        {file.filename}
                      </span>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile(index)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <i className="pi pi-times" style={{ fontSize: '10px' }}></i>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddFile}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  color: textColor,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? '#f3f4f6' : '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title="Add file"
              >
                <i className="pi pi-plus" style={{ fontSize: '12px' }}></i>
              </button>
            </div>

            {/* Right side - Language selector */}
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
                <span>{files[activeTab]?.language || 'javascript'}</span>
                <i className="pi pi-chevron-down" style={{ fontSize: '10px' }}></i>
              </button>

              {/* Language dropdown */}
              {showLanguageSelector && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: '12px',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorder}`,
                    borderRadius: '8px',
                    boxShadow:
                      theme === 'light'
                        ? '0 10px 25px rgba(0, 0, 0, 0.15)'
                        : '0 10px 25px rgba(0, 0, 0, 0.5)',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    zIndex: 10000,
                    minWidth: '180px',
                  }}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(activeTab, lang)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor:
                          files[activeTab]?.language === lang
                            ? theme === 'light'
                              ? '#f3f4f6'
                              : '#374151'
                            : 'transparent',
                        color:
                          files[activeTab]?.language === lang
                            ? '#60a5fa'
                            : theme === 'light'
                              ? '#374151'
                              : '#d1d5db',
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
                        if (files[activeTab]?.language !== lang) {
                          e.currentTarget.style.backgroundColor =
                            theme === 'light' ? '#f3f4f6' : '#374151'
                          e.currentTarget.style.color = theme === 'light' ? '#111827' : '#f3f4f6'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (files[activeTab]?.language !== lang) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color =
                            theme === 'light' ? '#374151' : '#d1d5db'
                        }
                      }}
                    >
                      {files[activeTab]?.language === lang && (
                        <i className="pi pi-check" style={{ fontSize: '12px' }}></i>
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
            <textarea
              value={files[activeTab]?.code || ''}
              onChange={(e) => handleCodeChange(activeTab, e.target.value)}
              placeholder="Enter your code here..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: 0,
                backgroundColor: 'transparent',
                color: 'inherit',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5',
                resize: 'vertical',
              }}
            />
          </pre>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  // Preview mode - with tabs but read-only
  return (
    <NodeViewWrapper
      className="code-group-wrapper"
      style={{ outline: 'none' }}
      data-drag-handle
    >
      <style>{`
        .code-group-wrapper .shiki {
          background-color: var(${theme === 'dark' ? '--shiki-dark-bg' : '--shiki-light-bg'}) !important;
          margin: 0 !important;
        }
        .code-group-wrapper .shiki span {
          color: var(${theme === 'dark' ? '--shiki-dark' : '--shiki-light'}) !important;
          background-color: transparent !important;
        }
      `}</style>
      <div
        style={{
          margin: '20px 0',
          padding: '4px',
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          backgroundColor: outerBg,
          outline: 'none',
        }}
        tabIndex={-1}
      >
        {/* Tabs header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
                onClick={() => handleTabChange(index)}
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
                  color: activeTab === index ? primaryColor : textSecondary,
                  textDecoration: activeTab === index ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {file.filename}
              </button>
            ))}
          </div>

          {/* Copy button - fixed position */}
          <div style={{ flexShrink: 0, backgroundColor: outerBg, zIndex: 30, display: 'flex', alignItems: 'center' }}>
            <button
              onClick={handleCopy}
              onMouseEnter={() => setShowCopyTooltip(true)}
              onMouseLeave={() => setShowCopyTooltip(false)}
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

        {/* Code content - Shiki handles all styling */}
        <div
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {highlightedCode[activeTab] ? (
            <div
              ref={codeRef as React.RefObject<HTMLDivElement>}
              dangerouslySetInnerHTML={{ __html: highlightedCode[activeTab] }}
            />
          ) : (
            <pre
              ref={codeRef as React.RefObject<HTMLPreElement>}
              style={{
                margin: 0,
                padding: '16px',
                backgroundColor: codeBg,
                color: codeColor,
                overflow: 'auto',
                fontSize: '15px',
                lineHeight: '1.7',
              }}
            >
              <code>{files[activeTab]?.code || ''}</code>
            </pre>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
