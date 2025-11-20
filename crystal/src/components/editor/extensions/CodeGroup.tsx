import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CodeGroupNodeView } from '../node-views/CodeGroupNodeView'

export const CodeGroup = Node.create({
  name: 'codeGroup',
  group: 'block',
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      files: {
        default: [{ filename: 'example.js', language: 'javascript', code: '' }],
        parseHTML: (element) => {
          const filesAttr = element.getAttribute('data-files')
          return filesAttr ? JSON.parse(filesAttr) : [{ filename: 'example.js', language: 'javascript', code: '' }]
        },
        renderHTML: (attributes) => {
          return {
            'data-files': JSON.stringify(attributes.files),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="code-group"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'code-group',
        'data-files': JSON.stringify(node.attrs.files),
        ...HTMLAttributes,
      },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeGroupNodeView)
  },

  addCommands() {
    return {
      setCodeGroup:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              files: [{ filename: 'example.js', language: 'javascript', code: '' }],
            },
          })
        },
    }
  },
})
