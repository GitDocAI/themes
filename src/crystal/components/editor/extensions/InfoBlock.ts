import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { InfoNodeView } from '../node-views/InfoNodeView'

export const InfoBlock = Node.create({
  name: 'infoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'info',
      },
      title: {
        default: '',
      },
      content: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="info-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'info-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoNodeView)
  },

  addCommands() {
    return {
      setInfoBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `info-${Date.now()}`,
              type: 'info',
              ...attributes,
            },
          })
        },
    } as any
  },
})
