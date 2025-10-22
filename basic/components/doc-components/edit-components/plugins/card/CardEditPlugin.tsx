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

    // Get current markdown
    const currentMarkdown = editorRef.current.getMarkdown()

    // Build the old card markdown to find and replace
    let oldCardMarkdown = '<Card'
    if (title) oldCardMarkdown += ` title="${title}"`
    if (subtitle) oldCardMarkdown += ` subtitle="${subtitle}"`
    if (icon) oldCardMarkdown += ` icon="${icon}"`
    if (image) oldCardMarkdown += ` image="${image}"`
    if (href) oldCardMarkdown += ` href="${href}"`
    oldCardMarkdown += `>\n  ${getContentText(mdastNode)}\n</Card>`

    // Replace in markdown
    const newMarkdown = currentMarkdown.replace(oldCardMarkdown, cardMarkdown)
    editorRef.current.setMarkdown(newMarkdown)

    // Save to webhook
    await saveToWebhook(newMarkdown)
  }

  return (
    <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
      <button
        onClick={() => setShowEditModal(true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 1,
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        Edit
      </button>
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
