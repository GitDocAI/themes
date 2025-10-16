// components/Editor/CustomNodeViews.tsx
import React from 'react'
import { Node, Mark, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { components } from '../../../shared/mdx_components/components'

// === BLOQUES ===

// Párrafo
const ParagraphComponent = ({ node }) => {
  const P = components.p
  return <P>{node.textContent}</P>
}

export const CustomParagraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'p' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ParagraphComponent)
  },
})

// Encabezados
const HeadingComponent = ({ node }) => {
  const level = node.attrs.level
  const H = components[`h${level}`] || components.h1
  return <H>{node.textContent}</H>
}

export const CustomHeading = Node.create({
  name: 'heading',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
    }
  },
  parseHTML() {
    return [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [`h${node.attrs.level}`, mergeAttributes(HTMLAttributes), 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(HeadingComponent)
  },
})

// Blockquote
const BlockquoteComponent = ({ node }) => {
  const BlockQuote = components.blockquote
  return <BlockQuote>{node.textContent}</BlockQuote>
}

export const CustomBlockquote = Node.create({
  name: 'blockquote',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'blockquote' }]
  },
  renderHTML() {
    return ['blockquote', 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteComponent)
  },
})

// Listas
const ListItemComponent = ({ node }) => <li>{node.textContent}</li>

export const CustomListItem = Node.create({
  name: 'listItem',
  group: 'listItem',
  content: 'paragraph block*',
  parseHTML() {
    return [{ tag: 'li' }]
  },
  renderHTML() {
    return ['li', 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ListItemComponent)
  },
})

const BulletListComponent = ({ node }) => <ul>{node.content.map(c => c.textContent).join('')}</ul>

export const CustomBulletList = Node.create({
  name: 'bulletList',
  group: 'block',
  content: 'listItem+',
  parseHTML() {
    return [{ tag: 'ul' }]
  },
  renderHTML() {
    return ['ul', 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(BulletListComponent)
  },
})

// === FORMATO INLINE ===

// Negrita
export const CustomBold = Mark.create({
  name: 'bold',
  parseHTML() {
    return [{ tag: 'strong' }, { style: 'font-weight=bold' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['strong', mergeAttributes(HTMLAttributes), 0]
  },
})

// Cursiva
export const CustomItalic = Mark.create({
  name: 'italic',
  parseHTML() {
    return [{ tag: 'em' }, { style: 'font-style=italic' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['em', mergeAttributes(HTMLAttributes), 0]
  },
})

// Tachado
export const CustomStrike = Mark.create({
  name: 'strike',
  parseHTML() {
    return [{ tag: 's' }, { tag: 'del' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['del', mergeAttributes(HTMLAttributes), 0]
  },
})

// Código inline
const InlineCodeComponent = ({ node }) => {
  const Code = components.inlineCode
  return <Code>{node.textContent}</Code>
}

export const CustomInlineCode = Node.create({
  name: 'inlineCode',
  group: 'inline',
  inline: true,
  atom: true,
  parseHTML() {
    return [{ tag: 'code' }]
  },
  renderHTML() {
    return ['code', 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(InlineCodeComponent)
  },
})

// === COMPONENTES CUSTOM DE NEXTRA ===

const AlertNodeFactory = (type: string) => {
  const AlertComp = components[type.charAt(0).toUpperCase() + type.slice(1)]
  const AlertView = ({ node }) => <AlertComp>{node.textContent}</AlertComp>

  return Node.create({
    name: type,
    group: 'block',
    atom: true,
    content: 'inline*',
    parseHTML() {
      return [{ tag: type.toLowerCase() }]
    },
    renderHTML() {
      return [type.toLowerCase(), 0]
    },
    addNodeView() {
      return ReactNodeViewRenderer(AlertView)
    },
  })
}

export const CustomTip = AlertNodeFactory('Tip')
export const CustomNote = AlertNodeFactory('Note')
export const CustomWarning = AlertNodeFactory('Warning')
export const CustomDanger = AlertNodeFactory('Danger')
export const CustomInfo = AlertNodeFactory('Info')

// === EXPORT GLOBAL ===

export const Components = () => [
  CustomParagraph,
  CustomHeading,
  CustomBlockquote,
  CustomBulletList,
  CustomListItem,
  CustomBold,
  CustomItalic,
  CustomStrike,
  CustomInlineCode,
  CustomTip,
  CustomNote,
  CustomWarning,
  CustomDanger,
  CustomInfo,
]

