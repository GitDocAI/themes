'use client'

import React, { useState, useEffect } from 'react'
import { codeToHtml } from 'shiki'

interface CodeFile {
  filename: string
  code: string
  language: string
}

interface CodeGroupProps {
  children: React.ReactNode
}

interface FileProps {
  name: string
  lang: string
  code?: string
  children?: string | React.ReactNode
}

// Helper to extract text content from children
const extractText = (node: any): string => {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node)) {
    return extractText((node.props as any).children)
  }
  return ''
}

export const CodeGroup: React.FC<CodeGroupProps> = ({ children }) => {
  const [files, setFiles] = useState<CodeFile[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [highlightedCode, setHighlightedCode] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<string>('')

  useEffect(() => {
    const parsedFiles: CodeFile[]= []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return

      const props = child.props as any

      // Check if it's a File component with name and lang
      if (props.name && props.lang) {
        const filename = props.name
        const language = props.lang
        // Use code prop if provided, otherwise extract from children
        const code = (props.code || extractText(props.children)).trim()

        if (code) {
          parsedFiles.push({ filename, code, language })
          console.log(`✅ Added file: ${filename} (${language})`)
        }
      }
    })

    console.log('🎯 Final parsed files:', parsedFiles)
    setFiles(parsedFiles)
  }, [children])

  useEffect(() => {
    // Detect current theme
    const isDark = document.documentElement.classList.contains('dark-theme')
    const theme = isDark ? 'dark' : 'light'
    setCurrentTheme(theme)

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const newIsDark = document.documentElement.classList.contains('dark-theme')
      const newTheme = newIsDark ? 'dark' : 'light'
      if (newTheme !== currentTheme) {
        setCurrentTheme(newTheme)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [currentTheme])

  useEffect(() => {
    // Highlight all code blocks
    const highlightAll = async () => {
      // Detect current theme
      const isDark = document.documentElement.classList.contains('dark-theme')

      const highlighted = await Promise.all(
        files.map(async (file) => {
          try {
            return await codeToHtml(file.code, {
              lang: file.language,
              theme: isDark ? 'github-dark' : 'github-light',
            })
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
  }, [files, currentTheme])

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

  return (
    <div className="code-group">
      {/* Tabs mode - showing filenames */}
      <div className="code-group-header-tabs">
        <div className="code-group-tabs">
          {files.map((file, index) => (
            <button
              key={index}
              className={`code-group-tab ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              {file.filename}
            </button>
          ))}
        </div>
        <button
          className="code-group-copy-btn"
          onClick={handleCopy}
          title="Copy code"
        >
          <i className={copied ? 'pi pi-check' : 'pi pi-copy'}></i>
        </button>
      </div>

      <div
        className="code-group-content"
        dangerouslySetInnerHTML={{ __html: highlightedCode[activeIndex] }}
      />
    </div>
  )
}

// File component - simple wrapper that just holds the code
export const File: React.FC<FileProps> = ({ children }) => {
  return <>{children}</>
}
