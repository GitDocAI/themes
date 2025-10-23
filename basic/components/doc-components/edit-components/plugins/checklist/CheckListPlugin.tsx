'use client'
import { NestedLexicalEditor } from '@mdxeditor/editor'
import React, { useContext, useState } from 'react'

export const CheckListEditPlugin = (EditorContext: React.Context<any>) => {
  return {
    name: 'CheckList',
    kind: 'flow',
    props: [],
    hasChildren: true,

    Editor: ({ mdastNode }: any) => {
      const Wrapper = () => {
        const context = useContext(EditorContext)
        const editorRef = context?.editorRef
        const saveToWebhook = context?.saveToWebhook

        const [isHovering, setIsHovering] = useState(false)
        const [lastSavedChange, setLastSavedChange] = useState<string>('')

        const updateMarkdown = async () => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()
          if (currentMarkdown === lastSavedChange) return
          setLastSavedChange(currentMarkdown)
          if (saveToWebhook) await saveToWebhook(currentMarkdown)
        }

        const handleAddItem = () => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()
          const lines = currentMarkdown.split('\n')

          let insertIndex = -1
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '</CheckList>') {
              insertIndex = i
              break
            }
          }

          if (insertIndex !== -1) {
            lines.splice(
              insertIndex,
              0,
              '  <CheckItem variant="do">New Item</CheckItem>'
            )
            const updated = lines.join('\n')
            editorRef.current.setMarkdown(updated)
            updateMarkdown()
          }
        }

        return (
          <div
            className="my-6 relative bg-background rounded-md p-4 transition-all"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
          <NestedLexicalEditor
            getContent={(node:any) => node.children}
            getUpdatedMdastNode={(node, children) => ({
              ...node,
              children,
            })}
          />
            <button
              onClick={handleAddItem}
              className="mt-4 flex items-center gap-2 text-secondary/70 border border-primary/30 px-3 py-2 rounded hover:bg-primary/10 transition-colors opacity-70 hover:opacity-100"
            >
              <i className="pi pi-plus text-primary" />
              Add item
            </button>
          </div>
        )
      }

      return <Wrapper />
    },
  }
}

