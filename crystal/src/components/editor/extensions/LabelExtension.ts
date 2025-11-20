import { Mark, mergeAttributes } from '@tiptap/core'

export interface LabelOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    label: {
      setLabel: (options: { label: string; color?: string }) => ReturnType
      toggleLabel: (options: { label: string; color?: string }) => ReturnType
      unsetLabel: () => ReturnType
    }
  }
}

export const LabelExtension = Mark.create<LabelOptions>({
  name: 'label',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      label: {
        default: '',
        parseHTML: element => element.getAttribute('data-label-text'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            'data-label-text': attributes.label,
          }
        },
      },
      color: {
        default: '#3b82f6',
        parseHTML: element => element.getAttribute('data-label-color'),
        renderHTML: attributes => {
          if (!attributes.color) {
            return {}
          }

          return {
            'data-label-color': attributes.color,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-label]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-label': '' }), 0]
  },

  addCommands() {
    return {
      setLabel:
        (options) =>
        ({ commands }) => {
          return commands.setMark(this.name, options)
        },
      toggleLabel:
        (options) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, options)
        },
      unsetLabel:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})
