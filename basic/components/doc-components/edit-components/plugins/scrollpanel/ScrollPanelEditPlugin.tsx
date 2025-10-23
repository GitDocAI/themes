'use client'
import { useContext, useState } from "react"
import { NestedLexicalEditor } from '@mdxeditor/editor'
import { components } from '@/shared/mdx_components/components'
import { ScrollPanelEditModal } from './ScrollPanelEditModal'

export const ScrollPanelEditPlugin = (EditorContext: React.Context<any>) => {
  const EditableScrollPanel = ({ mdastNode }: { mdastNode: any }) => {
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
            console.error('Error parsing scrollpanel attribute:', attr.name, error)
            props[attr.name] = attr.value?.value
          }
          continue
        }
        // Boolean attributes have null value
        props[attr.name] = attr.value === null ? true : attr.value
      }
    }

    const height = props.height || '400px'
    const width = props.width || '100%'

    const handleUpdate = async (newHeight: string, newWidth: string) => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Find and replace the scrollpanel - using regex to match <ScrollPanel...>...</ScrollPanel>
      const scrollPanelRegex = /<ScrollPanel[\s\S]*?<\/ScrollPanel>/g

      // Build new scrollpanel markdown
      let newScrollPanelMarkdown = '<ScrollPanel'
      if (newHeight !== '400px') newScrollPanelMarkdown += `\n  height="${newHeight}"`
      if (newWidth !== '100%') newScrollPanelMarkdown += `\n  width="${newWidth}"`
      newScrollPanelMarkdown += '>\n\n'

      // Extract content between tags
      const match = currentMarkdown.match(/<ScrollPanel[\s\S]*?>([\s\S]*?)<\/ScrollPanel>/)
      const content = match ? match[1] : '\n\n'

      newScrollPanelMarkdown += content
      newScrollPanelMarkdown += '</ScrollPanel>\n\n'

      const newMarkdown = currentMarkdown.replace(scrollPanelRegex, newScrollPanelMarkdown.trim())

      editorRef.current.setMarkdown(newMarkdown)

      // Save to webhook
      await saveToWebhook(newMarkdown)
      setShowEditModal(false)
    }

    const handleDelete = async () => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Remove scrollpanel from markdown
      const scrollPanelRegex = /<ScrollPanel[\s\S]*?<\/ScrollPanel>/g
      const newMarkdown = currentMarkdown.replace(scrollPanelRegex, '')

      editorRef.current.setMarkdown(newMarkdown)

      // Save to webhook
      await saveToWebhook(newMarkdown)
    }

    return (
      <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <components.ScrollPanel {...props}>
            <NestedLexicalEditor
              getContent={(node: any) => node.children}
              getUpdatedMdastNode={(node, children) => ({
                ...node,
                children,
              })}
            />
          </components.ScrollPanel>
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
        <ScrollPanelEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          initialHeight={height}
          initialWidth={width}
        />
      </div>
    )
  }

  return {
    name: 'ScrollPanel',
    kind: 'flow' as const,
    hasChildren: true,
    Editor: EditableScrollPanel,
  }
}
