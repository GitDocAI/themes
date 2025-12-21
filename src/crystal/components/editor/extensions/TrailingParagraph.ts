import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const TrailingParagraph = Extension.create({
  name: 'trailingParagraph',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('trailingParagraph')

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (transactions, _oldState, newState) => {
          // Only process if there was an actual document change
          const docChanged = transactions.some(tr => tr.docChanged)
          if (!docChanged) {
            return null
          }

          // Don't process if this is a content change inside a nested node
          // (prevents interference with nested NodeViewContent)
          const isNestedContentChange = transactions.some(tr => {
            // Check if the transaction only modifies text content
            let isTextOnly = true
            tr.steps.forEach(step => {
              const stepJSON = step.toJSON()
              // ReplaceStep with no slice content change is likely a structural change
              if (stepJSON.stepType === 'replace') {
                const slice = stepJSON.slice
                if (slice && slice.content && slice.content.length > 0) {
                  // Check if it's inserting a paragraph (which we do)
                  const firstContent = slice.content[0]
                  if (firstContent.type === 'paragraph' && (!firstContent.content || firstContent.content.length === 0)) {
                    isTextOnly = false
                  }
                }
              }
            })
            return isTextOnly && tr.steps.length > 0
          })

          // Skip if this looks like a text editing change to avoid interfering
          // with content inside nested nodes
          if (isNestedContentChange && transactions.every(tr => tr.steps.length <= 2)) {
            return null
          }

          const { doc, tr } = newState
          let modified = false
          const insertions: { pos: number }[] = []

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
              // If node is empty, mark for paragraph insertion
              if (node.childCount === 0) {
                insertions.push({ pos: pos + 1 })
                return true
              }

              // Check if the last child is a complex node (not a paragraph)
              const lastChild = node.lastChild
              if (lastChild && lastChild.type.name !== 'paragraph') {
                const isComplexNode = complexNodeTypes.includes(lastChild.type.name)
                if (isComplexNode) {
                  // Mark position for paragraph insertion
                  const endPos = pos + node.nodeSize - 1
                  insertions.push({ pos: endPos })
                }
              }
            }
            return true
          })

          // Apply insertions in reverse order to maintain correct positions
          insertions
            .sort((a, b) => b.pos - a.pos)
            .forEach(({ pos }) => {
              tr.insert(pos, newState.schema.nodes.paragraph.create())
              modified = true
            })

          return modified ? tr : null
        },
      }),
    ]
  },
})
