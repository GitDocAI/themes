import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TableNodeView } from '../node-views/TableNodeView'

export const TableBlock = Node.create({
  name: 'tableBlock',
  group: 'block',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      // Scrollable attributes
      scrollable: {
        default: false,
      },
      scrollHeight: {
        default: 400,
      },
      // Pagination attributes
      pagination: {
        default: false,
      },
      rowsPerPage: {
        default: 10,
      },
      rowsPerPageOptions: {
        default: [5, 10, 25, 50],
      },
      // Table data
      columns: {
        default: [
          { id: 'col1', label: 'Column 1', sortable: false, filterable: false },
          { id: 'col2', label: 'Column 2', sortable: false, filterable: false },
          { id: 'col3', label: 'Column 3', sortable: false, filterable: false },
        ],
      },
      rows: {
        default: [
          { id: 'row1', col1: 'Data 1-1', col2: 'Data 1-2', col3: 'Data 1-3' },
          { id: 'row2', col1: 'Data 2-1', col2: 'Data 2-2', col3: 'Data 2-3' },
          { id: 'row3', col1: 'Data 3-1', col2: 'Data 3-2', col3: 'Data 3-3' },
        ],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="table-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableNodeView)
  },

  addCommands() {
    return {
      setTableBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              scrollable: false,
              scrollHeight: 400,
              pagination: false,
              rowsPerPage: 10,
              rowsPerPageOptions: [5, 10, 25, 50],
              columns: [
                { id: 'col1', label: 'Column 1', sortable: false, filterable: false },
                { id: 'col2', label: 'Column 2', sortable: false, filterable: false },
                { id: 'col3', label: 'Column 3', sortable: false, filterable: false },
              ],
              rows: [
                { id: 'row1', col1: 'Data 1-1', col2: 'Data 1-2', col3: 'Data 1-3' },
                { id: 'row2', col1: 'Data 2-1', col2: 'Data 2-2', col3: 'Data 2-3' },
                { id: 'row3', col1: 'Data 3-1', col2: 'Data 3-2', col3: 'Data 3-3' },
              ],
            },
          })
        },
    } as any
  },
})
