import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CardNodeView } from '../node-views/CardNodeView'

export const CardBlock = Node.create({
  name: 'cardBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  isolating: true,

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        const { $from } = selection

        // Check if we're inside a cardBlock
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'cardBlock') {
            // Check if the card content is empty or has only an empty paragraph
            const cardContent = node.content
            const isEmpty = cardContent.size === 0 ||
              (cardContent.childCount === 1 &&
               cardContent.firstChild?.type.name === 'paragraph' &&
               cardContent.firstChild?.content.size === 0)

            // If card is empty and cursor is at the start, prevent deletion
            if (isEmpty) {
              const posInCard = $from.pos - $from.start(depth)
              if (posInCard <= 1) {
                return true // Prevent backspace from deleting the card
              }
            }
            break
          }
        }

        return false // Let default behavior handle it
      },
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
      title: {
        default: '',
      },
      icon: {
        default: '',
      },
      iconAlign: {
        default: 'left',
      },
      href: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="card-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'card-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardNodeView)
  },

  addCommands() {
    return {
      setCardBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `card-${Date.now()}`,
              ...attributes,
            },
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Card content goes here...',
                  },
                ],
              },
            ],
          })
        },
    } as any
  },
})
