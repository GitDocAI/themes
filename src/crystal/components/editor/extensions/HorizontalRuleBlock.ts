import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { HorizontalRuleNodeView } from '../node-views/HorizontalRuleNodeView'

export const HorizontalRuleBlock = Node.create({
  name: 'horizontalRuleBlock',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'hr[data-type="horizontal-rule-block"]',
      },
    ]
  },

   renderHTML({ HTMLAttributes }) {
      return [
        'hr',
        mergeAttributes(HTMLAttributes, {
          'data-custom-separator': 'true',
        }),
      ]
    },

  addNodeView() {
    return ReactNodeViewRenderer(HorizontalRuleNodeView)
  },

addInputRules() {
  return [
    nodeInputRule({
      find: /^(---|\*\*\*|___)$/,
      type: this.type,
    }),
  ]
}

})
