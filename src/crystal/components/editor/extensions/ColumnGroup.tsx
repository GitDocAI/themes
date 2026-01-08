import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ColumnGroupNodeView } from '../node-views/ColumnGroupNodeView'

export const ColumnGroup = Node.create({
  name: 'columnsBlock',
  group: 'block',
  content: 'column{1,3}', // Must have 1-3 columns
  atom: false,
  selectable: true,
  draggable: true,
  allowGapCursor: true,

  addAttributes() {
    return {
      columnCount: {
        default: 2,
        parseHTML: (element) => {
          const count = element.getAttribute('data-column-count')
          return count ? parseInt(count) : 2
        },
        renderHTML: (attributes) => ({
          'data-column-count': attributes.columnCount,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column-group"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column-group',
        'data-column-count': HTMLAttributes.columnCount,
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ColumnGroupNodeView)
  },

  addCommands() {
    return {
      setColumnGroup:
        (columnCount: number = 2) =>
        ({ commands }: any) => {
          // Validate column count
          const validCount = Math.min(Math.max(columnCount, 1), 3)

          return commands.insertContent([
            {
              type: this.name,
              attrs: {
                columnCount: validCount,
              },
              content: Array.from({ length: validCount }, () => ({
                type: 'column',
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              })),
            },
            {
              type: 'paragraph', // Add trailing paragraph after column group
            },
          ])
        },
    } as any
  },

})
