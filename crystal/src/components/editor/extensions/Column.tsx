import { Node, mergeAttributes } from '@tiptap/core'

export const Column = Node.create({
  name: 'column',
  content: 'block+', // Can contain multiple block nodes
  isolating: true,

  addAttributes() {
    return {
      width: {
        default: 'auto',
        parseHTML: (element) => element.getAttribute('data-width') || 'auto',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column',
      }),
      0,
    ]
  },
})
