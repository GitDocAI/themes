import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { StepsNodeView } from '../node-views/StepsNodeView'
import { StepNodeView } from '../node-views/StepNodeView'

// Individual Step
export const StepBlock = Node.create({
  name: 'stepBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: 'Step',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="step-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'step-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepNodeView)
  },
})

// Steps container
export const StepsBlock = Node.create({
  name: 'stepsBlock',
  group: 'block',
  content: 'stepBlock+',
  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="steps-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'steps-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepsNodeView)
  },

  addCommands() {
    return {
      setStepsBlock:
        (stepCount: number = 3) =>
        ({ commands }: any) => {
          const steps = Array.from({ length: stepCount }, (_, i) => ({
            type: 'stepBlock',
            attrs: { title: `Step ${i + 1}` },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: `Content for step ${i + 1}` }],
              },
            ],
          }))

          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `steps-${Date.now()}`,
            },
            content: steps,
          })
        },
    } as any
  },
})
