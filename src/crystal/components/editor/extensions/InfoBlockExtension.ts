import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { InfoBlockNodeView } from '../node-views/InfoBlockNodeView'

// Helper function to create keyboard shortcuts that prevent deletion when content is empty
const createBackspaceHandler = (nodeName: string) => {
  return function(this: any) {
    return {
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        const { $from } = selection

        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === nodeName) {
            const nodeContent = node.content
            const isEmpty = nodeContent.size === 0 ||
              (nodeContent.childCount === 1 &&
               nodeContent.firstChild?.type.name === 'paragraph' &&
               nodeContent.firstChild?.content.size === 0)

            if (isEmpty) {
              const posInNode = $from.pos - $from.start(depth)
              if (posInNode <= 1) {
                return true
              }
            }
            break
          }
        }

        return false
      },
    }
  }
}

export const InfoBlockExtension = Node.create({
  name: 'infoBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,
  isolating: true,

  addKeyboardShortcuts: createBackspaceHandler('infoBlock'),

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'info',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="info-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'info-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBlockNodeView)
  },

  addCommands() {
    return {
      setInfoBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `info-${Date.now()}`,
              type: 'info',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Info message here...' }],
              },
            ],
          })
        },
    } as any
  },
})

export const NoteBlockExtension = Node.create({
  name: 'noteBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,
  isolating: true,

  addKeyboardShortcuts: createBackspaceHandler('noteBlock'),

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'note',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="note-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'note-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBlockNodeView)
  },

  addCommands() {
    return {
      setNoteBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `note-${Date.now()}`,
              type: 'note',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Note message here...' }],
              },
            ],
          })
        },
    } as any
  },
})

export const TipBlockExtension = Node.create({
  name: 'tipBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,
  isolating: true,

  addKeyboardShortcuts: createBackspaceHandler('tipBlock'),

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'tip',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tip-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tip-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBlockNodeView)
  },

  addCommands() {
    return {
      setTipBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `tip-${Date.now()}`,
              type: 'tip',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Tip message here...' }],
              },
            ],
          })
        },
    } as any
  },
})

export const WarningBlockExtension = Node.create({
  name: 'warningBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,
  isolating: true,

  addKeyboardShortcuts: createBackspaceHandler('warningBlock'),

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'warning',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="warning-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'warning-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBlockNodeView)
  },

  addCommands() {
    return {
      setWarningBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `warning-${Date.now()}`,
              type: 'warning',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Warning message here...' }],
              },
            ],
          })
        },
    } as any
  },
})

export const DangerBlockExtension = Node.create({
  name: 'dangerBlock',
  group: 'block',
  content: 'block+',
  draggable: true,
  defining: true,
  isolating: true,

  addKeyboardShortcuts: createBackspaceHandler('dangerBlock'),

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'danger',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="danger-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'danger-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBlockNodeView)
  },

  addCommands() {
    return {
      setDangerBlock:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `danger-${Date.now()}`,
              type: 'danger',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Danger message here...' }],
              },
            ],
          })
        },
    } as any
  },
})
