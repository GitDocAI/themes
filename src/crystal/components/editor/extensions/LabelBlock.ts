import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { LabelNodeView } from '../node-views/LabelNodeView'

export const LabelBlock = Node.create({
  name: 'labelBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: 'Label',
      },
      color: {
        default: '#3b82f6',
      },
      size: {
        default: 'md',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="label-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'label-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(LabelNodeView)
  },

  addCommands() {
    return {
      setLabelBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `label-${Date.now()}`,
              ...attributes,
            },
          })
        },
    } as any
  },
})
