'use client'

import React, { useState, useEffect } from 'react'
import { codeToHtml } from 'shiki'

interface CodeTabData {
  title: string
  filename: string
  code: string
  language: string
}

interface CodeTabsProps {
  children?: React.ReactNode
}

interface TabProps {
  lang: string
  title: string
  filename?: string
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

export const CodeTabs: React.FC<CodeTabsProps> = ({ children }) => {
  const [tabs, setTabs] = useState<CodeTabData[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [highlightedCode, setHighlightedCode] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<string>('')

  useEffect(() => {
    const parsedTabs: CodeTabData[] = []

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return

      const props = child.props as any

      // Check if it's a Tab component
      if (props.lang && props.title) {
        const language = props.lang
        const title = props.title
        const filename = props.filename || `code.${language}`
        // Use code prop if provided, otherwise extract from children
        const code = (props.code || extractText(props.children)).trim()

        if (code) {
          parsedTabs.push({ title, filename, code, language })
        }
      }
    })

    setTabs(parsedTabs)
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
        tabs.map(async (tab) => {
          try {
            return await codeToHtml(tab.code, {
              lang: tab.language,
              theme: isDark ? 'github-dark' : 'github-light',
            })
          } catch (error) {
            console.error(`Error highlighting ${tab.language}:`, error)
            return `<pre><code>${tab.code}</code></pre>`
          }
        })
      )
      setHighlightedCode(highlighted)
    }

    if (tabs.length > 0) {
      highlightAll()
    }
  }, [tabs, currentTheme])

  const handleCopy = async () => {
    if (tabs[activeIndex]) {
      await navigator.clipboard.writeText(tabs[activeIndex].code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (tabs.length === 0 || highlightedCode.length === 0) {
    return null
  }

  return (
    <div className="code-group">
      {/* Dropdown mode with filename display */}
      <div className="code-group-header-dropdown">
        <span className="code-block-filename">{tabs[activeIndex].filename}</span>
        <div className="code-group-controls">
          <select
            className="code-group-dropdown"
            value={activeIndex}
            onChange={(e) => setActiveIndex(Number(e.target.value))}
          >
            {tabs.map((tab, index) => (
              <option key={index} value={index}>
                {tab.title}
              </option>
            ))}
          </select>
          <button
            className="code-group-copy-btn"
            onClick={handleCopy}
            title="Copy code"
          >
            <i className={copied ? 'pi pi-check' : 'pi pi-copy'}></i>
          </button>
        </div>
      </div>

      <div
        className="code-group-content"
        dangerouslySetInnerHTML={{ __html: highlightedCode[activeIndex] }}
      />
    </div>
  )
}

// Tab component - simple wrapper that just holds the code
export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>
}
