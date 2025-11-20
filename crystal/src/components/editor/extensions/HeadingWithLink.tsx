import React from 'react'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import Heading from '@tiptap/extension-heading'
import { useState } from 'react'

const HeadingComponent = ({ node, editor }: NodeViewProps) => {
  const [showCopyIcon, setShowCopyIcon] = useState(false)
  const [copied, setCopied] = useState(false)
  const level = node.attrs.level
  const isEditable = editor.isEditable

  // Get the text content of the heading
  const getHeadingText = () => {
    return node.textContent
  }

  // Generate ID from heading text
  const generateId = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
  }

  // Only show link icon for H1 in editable mode
  if (level !== 1 || !isEditable) {
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements
    return (
      <NodeViewWrapper>
        <Tag id={generateId(getHeadingText())}>
          <NodeViewContent />
        </Tag>
      </NodeViewWrapper>
    )
  }

  // Copy link to clipboard
  const copyLinkToClipboard = async () => {
    const text = getHeadingText()
    const id = generateId(text)
    // Copy the pathname + hash (relative URL without domain)
    const linkUrl = `${window.location.pathname}#${id}`

    try {
      await navigator.clipboard.writeText(linkUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements

  // Get font size based on heading level
  const getIconSize = () => {
    switch (level) {
      case 1:
        return '2rem' // Same as h1 font size
      case 2:
        return '1.75rem'
      case 3:
        return '1.5rem'
      default:
        return '1rem'
    }
  }

  return (
    <NodeViewWrapper>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
        onMouseEnter={() => setShowCopyIcon(true)}
        onMouseLeave={() => {
          setShowCopyIcon(false)
          setCopied(false)
        }}
      >
        <Tag
          id={generateId(getHeadingText())}
          style={{
            margin: 0,
          }}
        >
          <NodeViewContent />
        </Tag>
        {showCopyIcon && (
          <button
            onClick={copyLinkToClipboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            title={copied ? 'Copied!' : 'Copy link to heading'}
          >
            <i
              className={copied ? 'pi pi-check' : 'pi pi-link'}
              style={{
                fontSize: getIconSize(),
                color: copied ? '#10b981' : '#9ca3af',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = '#6b7280'
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            ></i>
          </button>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const HeadingWithLink = Heading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(HeadingComponent)
  },
})
