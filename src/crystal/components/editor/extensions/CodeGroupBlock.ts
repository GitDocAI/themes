import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeGroupNodeView } from '../node-views/CodeGroupNodeView'

export const CodeGroupBlock = Node.create({
  name: 'codeGroupBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      tabs: {
        default: [],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="codegroup-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'codegroup-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeGroupNodeView)
  },

  addCommands() {
    return {
      setCodeGroupBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `codegroup-${Date.now()}`,
              tabs: [],
              ...attributes,
            },
          })
        },
    } as any
  },
})
