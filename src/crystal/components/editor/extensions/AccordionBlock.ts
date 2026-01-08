import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { AccordionNodeView } from '../node-views/AccordionNodeView'
import { AccordionTabNodeView } from '../node-views/AccordionTabNodeView'

// Define AccordionTab node
export const AccordionTab = Node.create({
  name: 'accordionTab',
  content: 'block+',
  group: 'accordionTab',
  defining: true,

  addAttributes() {
    return {
      header: {
        default: 'Tab',
      },
      icon:{
        default:null
      },
      disabled: {
        default: false,
      },
      isActive: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="accordion-tab"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-tab' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionTabNodeView)
  },
})

// Define Accordion node
export const AccordionBlock = Node.create({
  name: 'accordionBlock',
  content: 'accordionTab+',
  group: 'block',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      multiple: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="accordion-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView)
  },

  addCommands() {
    return {
      setAccordionBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `accordion-${Date.now()}`,
              multiple: attributes?.multiple !== undefined ? attributes.multiple : true,
            },
            content: [
              {
                type: 'accordionTab',
                attrs: { header: 'Tab 1',icon:null, disabled: false, isActive: true },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Content 1' }],
                  },
                ],
              },
              {
                type: 'accordionTab',
                attrs: { header: 'Tab 2',icon:'pi pi-pencil', disabled: false, isActive: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Content 2' }],
                  },
                ],
              },
            ],
          })
        },
    } as any
  },
})
