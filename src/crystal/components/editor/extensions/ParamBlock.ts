import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ParamNodeView } from '../node-views/ParamNodeView'

export interface ParamBlockAttrs {
  id: string
  path: string
  type: string
  required: boolean
  default: string
  description: string
}

export const ParamBlock = Node.create({
  name: 'paramBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      path: {
        default: 'param',
      },
      type: {
        default: 'string',
      },
      required: {
        default: false,
        parseHTML: element => element.getAttribute('data-required') === 'true',
        renderHTML: attributes => {
          return { 'data-required': attributes.required ? 'true' : 'false' }
        },
      },
      default: {
        default: '',
      },
      description: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="param-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'param-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ParamNodeView)
  },

  addCommands() {
    return {
      setParamBlock:
        (attributes?: Partial<ParamBlockAttrs>) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `param-${Date.now()}`,
              path: attributes?.path || 'param',
              type: attributes?.type || 'string',
              required: attributes?.required || false,
              default: attributes?.default || '',
              description: attributes?.description || 'Parameter description',
            },
          })
        },
    } as any
  },
})
