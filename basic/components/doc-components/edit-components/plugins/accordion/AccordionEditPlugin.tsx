'use client'

import { useContext, useState } from 'react'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { AccordionEditModal } from './AccordionEditModal'

export const AccordionEditPlugin = (EditorContext: React.Context<any>) => {
  const EditableAccordion = ({ mdastNode }: { mdastNode: any }) => {
    const [showEditModal, setShowEditModal] = useState(false)
    const context = useContext(EditorContext)
    const editorRef = context?.editorRef
    const saveToWebhook = context?.saveToWebhook

    const props: Record<string, any> = {}

    // Extract props from mdastNode
    if (mdastNode.attributes && Array.isArray(mdastNode.attributes)) {
      for (const attr of mdastNode.attributes) {
        if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          try {
            props[attr.name] = JSON.parse(attr.value?.value)
          } catch (error) {
            props[attr.name] = attr.value?.value
          }
          continue
        }
        props[attr.name] = attr.value === null ? true : attr.value
      }
    }

    // Extract props helper
    const extractProps = (node: any) => {
      const props: Record<string, any> = {}
      if (node.attributes && Array.isArray(node.attributes)) {
        for (const attr of node.attributes) {
          if (attr.value?.type === "mdxJsxAttributeValueExpression") {
            try {
              props[attr.name] = JSON.parse(attr.value?.value)
            } catch {
              props[attr.name] = attr.value?.value
            }
          } else {
            props[attr.name] = attr.value === null ? true : attr.value
          }
        }
      }
      return props
    }

    // Convert mdast node back to markdown string
    const nodeToMarkdown = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node

      // Text nodes
      if (node.type === 'text') return node.value || ''

      // Paragraphs
      if (node.type === 'paragraph') {
        const content = node.children?.map(nodeToMarkdown).join('') || ''
        return content + '\n\n'
      }

      // Strong (bold)
      if (node.type === 'strong') {
        const content = node.children?.map(nodeToMarkdown).join('') || ''
        return `**${content}**`
      }

      // Emphasis (italic)
      if (node.type === 'emphasis') {
        const content = node.children?.map(nodeToMarkdown).join('') || ''
        return `*${content}*`
      }

      // Lists
      if (node.type === 'list') {
        return node.children?.map((item: any, idx: number) => {
          const content = nodeToMarkdown(item)
          if (node.ordered) {
            return `${idx + 1}. ${content}`
          } else {
            return `- ${content}`
          }
        }).join('') || ''
      }

      // List items
      if (node.type === 'listItem') {
        return node.children?.map(nodeToMarkdown).join('') || ''
      }

      // Code blocks
      if (node.type === 'code') {
        return '```' + (node.lang || '') + '\n' + (node.value || '') + '\n```\n\n'
      }

      // Inline code
      if (node.type === 'inlineCode') {
        return '`' + (node.value || '') + '`'
      }

      // Blockquotes
      if (node.type === 'blockquote') {
        const content = node.children?.map(nodeToMarkdown).join('') || ''
        return '> ' + content.replace(/\n/g, '\n> ') + '\n\n'
      }

      // Links
      if (node.type === 'link') {
        const text = node.children?.map(nodeToMarkdown).join('') || ''
        return `[${text}](${node.url || ''})`
      }

      // Headings
      if (node.type === 'heading') {
        const level = '#'.repeat(node.depth || 1)
        const content = node.children?.map(nodeToMarkdown).join('') || ''
        return `${level} ${content}\n\n`
      }

      // Fallback: process children
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(nodeToMarkdown).join('')
      }

      return ''
    }

    // Extract initial tabs for modal
    const initialTabs = mdastNode.children?.map((child: any, index: number) => {
      if (child.name === 'AccordionTab') {
        const tabProps = extractProps(child)
        const header = tabProps.header || `Tab ${index + 1}`
        const content = child.children?.map(nodeToMarkdown).join('').trim() || ''
        return { header, content }
      }
      return null
    }).filter(Boolean) || []

    const handleUpdate = async (tabs: any[], multiple: boolean) => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Use the mdastNode position to identify the exact location
      const { start, end } = mdastNode.position

      const before = currentMarkdown.slice(0, start.offset)
      const after = currentMarkdown.slice(end.offset)

      // Build new accordion markdown
      let newAccordionMarkdown = '<Accordion'
      if (multiple) {
        newAccordionMarkdown += ' multiple'
      }
      newAccordionMarkdown += '>\n'

      // Add each tab
      tabs.forEach((tab) => {
        newAccordionMarkdown += `  <AccordionTab header="${tab.header}">\n`
        newAccordionMarkdown += `    ${tab.content}\n`
        newAccordionMarkdown += `  </AccordionTab>\n`
      })

      newAccordionMarkdown += '</Accordion>'

      const updated = before + newAccordionMarkdown + after

      editorRef.current.setMarkdown(updated)
      await saveToWebhook(updated)

      setShowEditModal(false)
    }

    const handleDelete = async () => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Use the mdastNode position to identify the exact location
      const { start, end } = mdastNode.position

      const before = currentMarkdown.slice(0, start.offset)
      const after = currentMarkdown.slice(end.offset)

      const updated = before + after

      editorRef.current.setMarkdown(updated)
      await saveToWebhook(updated)
    }

    // Helper to render MDX content as simple HTML
    const renderMDXContent = (children: any[]): React.ReactNode => {
      if (!children || !Array.isArray(children)) return null

      return children.map((child: any, idx: number) => {
        // Handle text nodes
        if (child.type === 'text') {
          return child.value
        }

        // Handle paragraphs
        if (child.type === 'paragraph') {
          return <p key={idx}>{renderMDXContent(child.children)}</p>
        }

        // Handle strong (bold)
        if (child.type === 'strong') {
          return <strong key={idx}>{renderMDXContent(child.children)}</strong>
        }

        // Handle emphasis (italic)
        if (child.type === 'emphasis') {
          return <em key={idx}>{renderMDXContent(child.children)}</em>
        }

        // Handle lists
        if (child.type === 'list') {
          const ListTag = child.ordered ? 'ol' : 'ul'
          return <ListTag key={idx}>{renderMDXContent(child.children)}</ListTag>
        }

        // Handle list items
        if (child.type === 'listItem') {
          return <li key={idx}>{renderMDXContent(child.children)}</li>
        }

        // Handle code blocks
        if (child.type === 'code') {
          return <pre key={idx}><code>{child.value}</code></pre>
        }

        // Handle inline code
        if (child.type === 'inlineCode') {
          return <code key={idx}>{child.value}</code>
        }

        // Handle blockquotes
        if (child.type === 'blockquote') {
          return <blockquote key={idx}>{renderMDXContent(child.children)}</blockquote>
        }

        // Handle links
        if (child.type === 'link') {
          return <a key={idx} href={child.url}>{renderMDXContent(child.children)}</a>
        }

        // Handle headings
        if (child.type === 'heading') {
          const depth = child.depth || 1
          switch (depth) {
            case 1: return <h1 key={idx}>{renderMDXContent(child.children)}</h1>
            case 2: return <h2 key={idx}>{renderMDXContent(child.children)}</h2>
            case 3: return <h3 key={idx}>{renderMDXContent(child.children)}</h3>
            case 4: return <h4 key={idx}>{renderMDXContent(child.children)}</h4>
            case 5: return <h5 key={idx}>{renderMDXContent(child.children)}</h5>
            case 6: return <h6 key={idx}>{renderMDXContent(child.children)}</h6>
            default: return <h3 key={idx}>{renderMDXContent(child.children)}</h3>
          }
        }

        // Fallback: render children if they exist
        if (child.children) {
          return renderMDXContent(child.children)
        }

        return null
      })
    }

    // Render each AccordionTab with rendered MDX content
    const accordionTabs = mdastNode.children?.map((child: any, index: number) => {
      if (child.name === 'AccordionTab') {
        const tabProps = extractProps(child)
        const header = tabProps.header || `Tab ${index + 1}`

        return (
          <AccordionTab key={index} header={header}>
            <div className="accordion-tab-content">
              {renderMDXContent(child.children)}
            </div>
          </AccordionTab>
        )
      }
      return null
    }).filter(Boolean)

    return (
      <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Accordion {...props}>
            {accordionTabs}
          </Accordion>
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '8px',
            zIndex: 10,
          }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Delete
            </button>
          </div>
        </div>
        <AccordionEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          initialTabs={initialTabs}
          initialMultiple={props.multiple || false}
        />
      </div>
    )
  }

  return {
    name: 'Accordion',
    kind: 'flow' as const,
    hasChildren: true,
    Editor: EditableAccordion,
  }
}
