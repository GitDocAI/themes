import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { LabelNodeView } from '../node-views/LabelNodeView'

export interface LabelItem {
  id: string
  text: string
  color: string
  size: 'sm' | 'md' | 'lg'
  icon?: string
}

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
      // Support both old single label format and new multi-label format
      label: {
        default: null, // Deprecated: single label text
      },
      color: {
        default: null, // Deprecated: single label color
      },
      size: {
        default: null, // Deprecated: single label size
      },
      // New: array of labels stored as JSON string to ensure proper change detection
      labels: {
        default: '[]',
        parseHTML: element => {
          const labelsAttr = element.getAttribute('data-labels')
          return labelsAttr || '[]'
        },
        renderHTML: attributes => {
          if (attributes.labels && attributes.labels !== '[]') {
            return { 'data-labels': attributes.labels }
          }
          return {}
        },
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
          // Create initial label if not provided
          let labels = attributes.labels
          if (!labels) {
            labels = [{
              id: `label-item-${Date.now()}`,
              text: attributes.label || 'Label',
              color: attributes.color || '#3b82f6',
              size: attributes.size || 'md',
            }]
          }

          // Ensure labels is stored as JSON string for proper change detection
          const labelsString = typeof labels === 'string' ? labels : JSON.stringify(labels)

          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `label-${Date.now()}`,
              labels: labelsString,
            },
          })
        },
    } as any
  },
})
