import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const TrailingParagraph = Extension.create({
  name: 'trailingParagraph',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingParagraph'),
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, tr } = newState
          let modified = false

          // List of complex node types that need a trailing paragraph
          const complexNodeTypes = [
            'cardBlock',
            'accordionBlock',
            'tabsBlock',
            'codeGroup',
            'columnGroup',
            'rightPanel',
            'infoBlock',
            'noteBlock',
            'tipBlock',
            'warningBlock',
            'dangerBlock',
            'endpointBlock',
            'labelBlock',
          ]

          // Check all accordionTab and tabBlock nodes
          doc.descendants((node, pos) => {
            if (node.type.name === 'accordionTab' || node.type.name === 'tabBlock') {
              // Check if the last child is NOT a paragraph
              const lastChild = node.lastChild

              if (lastChild && lastChild.type.name !== 'paragraph') {
                // Check if the last child is a complex node
                const isComplexNode = complexNodeTypes.includes(lastChild.type.name)

                if (isComplexNode) {
                  // Add a paragraph at the end of this node
                  const endPos = pos + node.nodeSize - 1
                  tr.insert(endPos, newState.schema.nodes.paragraph.create())
                  modified = true
                }
              }

              // If node is empty, add a paragraph
              if (node.childCount === 0) {
                const insertPos = pos + 1
                tr.insert(insertPos, newState.schema.nodes.paragraph.create())
                modified = true
              }
            }
            return true
          })

          return modified ? tr : null
        },
      }),
    ]
  },
})
