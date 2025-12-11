import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EndpointNodeView } from '../node-views/EndpointNodeView'

export const EndpointBlock = Node.create({
  name: 'endpointBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      method: {
        default: 'GET',
      },
      path: {
        default: '/api/endpoint',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="endpoint-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'endpoint-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EndpointNodeView)
  },

  addCommands() {
    return {
      setEndpointBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `endpoint-${Date.now()}`,
              ...attributes,
            },
          })
        },
    } as any
  },
})
