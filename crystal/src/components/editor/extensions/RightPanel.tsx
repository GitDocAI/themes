import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { RightPanelNodeView } from '../node-views/RightPanelNodeView'

export const RightPanel = Node.create({
  name: 'rightPanel',
  group: 'block',
  content: 'block+', // Can contain multiple block nodes (paragraphs, headings, lists, etc.)
  isolating: true,
  selectable: true,
  draggable: true,
  allowGapCursor: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="right-panel"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'right-panel',
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RightPanelNodeView)
  },

  addCommands() {
    return {
      setRightPanel:
        () =>
        ({ commands }: any) => {
          return commands.insertContent([
            {
              type: this.name,
              attrs: {
                id: `right-panel-${Date.now()}`,
              },
              content: [
                {
                  type: 'heading',
                  attrs: { level: 3 },
                  content: [{ type: 'text', text: 'Custom Right Panel' }],
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Add your content here...' }],
                },
              ],
            },
            {
              type: 'paragraph', // Add trailing paragraph after right panel
            },
          ])
        },
    } as any
  },
})
