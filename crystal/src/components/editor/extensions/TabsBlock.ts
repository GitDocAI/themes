import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TabsNodeView } from '../node-views/TabsNodeView'
import { TabNodeView } from '../node-views/TabNodeView'

// Individual Tab extension
export const TabBlock = Node.create({
  name: 'tabBlock',
  content: 'block+',
  group: 'tabBlock',
  defining: true,

  addAttributes() {
    return {
      label: {
        default: 'Tab',
      },
      icon: {
        default: null,
      },
      isActive: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tab-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabNodeView)
  },
})

// Tabs Container extension
export const TabsBlock = Node.create({
  name: 'tabsBlock',
  content: 'tabBlock+',
  group: 'block',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      alignment: {
        default: 'left',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tabs-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tabs-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabsNodeView)
  },

  addCommands() {
    return {
      setTabsBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `tabs-${Date.now()}`,
              alignment: 'left',
            },
            content: [
              {
                type: 'tabBlock',
                attrs: { label: 'Tab 1', icon: null, isActive: true },
                content: [{ type: 'paragraph' }],
              },
              {
                type: 'tabBlock',
                attrs: { label: 'Tab 2', icon: null, isActive: false },
                content: [{ type: 'paragraph' }],
              },
            ],
          })
        },
    } as any
  },
})
