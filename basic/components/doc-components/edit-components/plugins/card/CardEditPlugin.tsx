import { useContext, useState } from "react"
import {
  NestedLexicalEditor,
} from '@mdxeditor/editor'
import { CardModal } from "./CardModal"
import type { MdxJsxTextElement } from 'mdast-util-mdx'
import { BasicPrimeCard } from "@/components/doc-components/Card"

export const CardEditPlugin= (EditorContext:React.Context<any>)=>{

const EditableCard = ({ mdastNode }: { mdastNode: any }) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const context = useContext(EditorContext)
  const editorRef = context?.editorRef
  const saveToWebhook = context?.saveToWebhook

  const titleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'title')
  const subtitleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'subtitle')
  const iconAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'icon')
  const hrefAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'href')
  const imageAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'image')

  const title = titleAttr?.value || 'Card title'
  const subtitle = subtitleAttr?.value
  const icon = iconAttr?.value
  const href = hrefAttr?.value
  const image = imageAttr?.value

  // Get content from children
  const getContentText = (node: any): string => {
    if (!node.children || node.children.length === 0) return 'Card content goes here'
    const firstChild = node.children[0]
    if (firstChild.type === 'text') return firstChild.value
    if (firstChild.type === 'paragraph' && firstChild.children) {
      const textChild = firstChild.children.find((c: any) => c.type === 'text')
      return textChild?.value || 'Card content goes here'
    }
    return 'Card content goes here'
  }

  const handleUpdate = async (cardMarkdown: string) => {
    if (!editorRef?.current || !saveToWebhook) return

    const currentMarkdown = editorRef.current.getMarkdown()

    // Use the mdastNode position to identify the exact location
    const { start, end } = mdastNode.position

    const before = currentMarkdown.slice(0, start.offset)
    const after = currentMarkdown.slice(end.offset)

    const updated = before + cardMarkdown + after

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

  return (
    <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
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
      <BasicPrimeCard title={title} subtitle={subtitle} icon={icon} href={href} image={image}>
        <NestedLexicalEditor<MdxJsxTextElement>
          getContent={(node) => node.children}
          getUpdatedMdastNode={(node, children) => ({ ...node, children: children as any })}
        />
      </BasicPrimeCard>
      <CardModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onInsert={handleUpdate}
        initialData={{
          title,
          subtitle,
          icon,
          href,
          image,
          content: getContentText(mdastNode),
        }}
      />
    </div>
  )
}
              return {
                name: 'Card',
                kind: 'flow',
                props: [
                  { name: 'title', type: 'string' },
                  { name: 'icon', type: 'string' },
                  { name: 'href', type: 'string' },
                  { name: 'img', type: 'string' },
                  { name: 'text', type: 'string' },
                ],
                hasChildren: true,
                Editor: ({ mdastNode }:any) => <EditableCard mdastNode={mdastNode} />,
              }
}
