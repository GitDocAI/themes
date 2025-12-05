import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageNodeView } from '../node-views/ImageNodeView'

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return {
      allowUpload: false,
    }
  },

  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: 'Image',
      },
      caption: {
        default: '',
      },
      type: {
        default: 'url', // 'url' or 'local'
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },

  addCommands() {
    return {
      setImageBlock:
        (attrs: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs?.src || '',
              alt: attrs?.alt || 'Image',
              caption: attrs?.caption || '',
              type: attrs?.type || 'url',
              ...attrs
            },
          })
        },
    } as any
  },
})
