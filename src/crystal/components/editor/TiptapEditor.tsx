import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import NodeRange from '@tiptap/extension-node-range'
import { useEffect, useRef } from 'react'
import './tiptap.css'
import './types'

// Import custom extensions
import { CardBlock } from './extensions/CardBlock'
import { AccordionBlock, AccordionTab } from './extensions/AccordionBlock'
import { TabsBlock, TabBlock } from './extensions/TabsBlock'
import { TableBlock } from './extensions/TableBlock'
import { ImageBlock } from './extensions/ImageBlock'
import { EndpointBlock } from './extensions/EndpointBlock'
import { LabelBlock } from './extensions/LabelBlock'
import { CodeGroup } from './extensions/CodeGroup'
import { CodeBlockWithLanguage } from './extensions/CodeBlockWithLanguage'
import { HeadingWithLink } from './extensions/HeadingWithLink'
import { Column } from './extensions/Column'
import { ColumnGroup } from './extensions/ColumnGroup'
import { RightPanel } from './extensions/RightPanel'
import {
  InfoBlockExtension,
  NoteBlockExtension,
  TipBlockExtension,
  WarningBlockExtension,
  DangerBlockExtension,
} from './extensions/InfoBlockExtension'
import { LabelExtension } from './extensions/LabelExtension'
import { TrailingParagraph } from './extensions/TrailingParagraph'

// Import toolbar
import { EditorToolbar } from './EditorToolbar'
import type { EditorToolbarRef } from './EditorToolbar'

interface TiptapEditorProps {
  content: any // Tiptap JSON format
  theme: 'light' | 'dark'
  onUpdate: (content: any) => void
  editable?: boolean
  allowUpload?: boolean
  minHeight?: string
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, theme, onUpdate, editable = true, allowUpload = false, minHeight = '200px' }) => {
  const toolbarRef = useRef<EditorToolbarRef>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom one
        dropcursor: {
          color: '#3b82f6',
          width: 2,
        },
        codeBlock: false, // Disable default code block
        link: false, // Disable default link to use custom one
      }),
      HeadingWithLink.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: 'Type / for commands...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: {
          class: 'custom-link',
        },
      }),
      CodeBlockWithLanguage,
      NodeRange,
      CardBlock,
      AccordionTab,
      AccordionBlock,
      TabBlock,
      TabsBlock,
      TableBlock,
      ImageBlock.configure({
        allowUpload,
      }),
      EndpointBlock,
      LabelBlock,
      CodeGroup,
      Column,
      ColumnGroup,
      RightPanel,
      InfoBlockExtension,
      NoteBlockExtension,
      TipBlockExtension,
      WarningBlockExtension,
      DangerBlockExtension,
      LabelExtension,
      TrailingParagraph,
    ],
    content: content,
    editable: editable,
    immediatelyRender: false, // Prevents flushSync warning with React 18+
    editorProps: {
      attributes: {
        class: `tiptap-editor ${theme === 'dark' ? 'dark-theme' : ''}`,
        style: `
          outline: none;
          min-height: ${minHeight};
          color: ${theme === 'light' ? '#374151' : '#d1d5db'};
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onUpdate(json)
    },
    onTransaction: ({ editor, transaction }) => {
      // Transaction event fires for ALL state changes including atom nodes
      // Only trigger onUpdate if there were actual document changes
      if (transaction.docChanged) {
        const json = editor.getJSON()
        onUpdate(json)
      }
    },
  })

  // Update editor content when content changes externally
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(content)

      if (currentContent !== newContent) {
        // Update immediately and don't emit update event to prevent cascading renders
        if (!editor.isDestroyed) {
          editor.commands.setContent(content, { emitUpdate: false })
        }
      }
    }
  }, [content, editor])

  // Update editor class when theme changes
  useEffect(() => {
    try{
      if (editor) {
        const editorElement = editor.view.dom
        if (theme === 'dark') {
          editorElement.classList.add('dark-theme')
        } else {
          editorElement.classList.remove('dark-theme')
        }
      }
    }catch(e){
      console.error(e)
    }
  }, [theme, editor])

  // Handle link hover in editable mode - open modal on hover
  useEffect(() => {
    if (!editor || !editable) return

    let hoverTimeout: number | null = null
    let currentLink: Element | null = null

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a.custom-link')

      if (link && link !== currentLink) {
        currentLink = link
        // Small delay to prevent accidental triggers
        hoverTimeout = setTimeout(() => {
          // Get link text and href directly from DOM
          const linkElement = link as HTMLAnchorElement
          const linkText = linkElement.textContent || ''
          const linkHref = linkElement.getAttribute('href') || ''

          // Get link position for modal positioning
          const rect = linkElement.getBoundingClientRect()

          // Find and select the link in the editor
          const pos = editor.view.posAtDOM(link, 0)
          if (pos !== null && pos !== undefined) {
            // Find the extent of the link mark
            let start = pos
            let end = pos

            // Search backwards and forwards for the link boundaries
            const doc = editor.state.doc

            // Find start
            let tempPos = pos
            while (tempPos > 0) {
              const $tempPos = doc.resolve(tempPos - 1)
              const marks = $tempPos.marks()
              const hasLink = marks.some(m => m.type.name === 'link' && m.attrs.href === linkHref)
              if (hasLink) {
                start = tempPos - 1
                tempPos--
              } else {
                break
              }
            }

            // Find end
            tempPos = pos
            while (tempPos < doc.content.size) {
              const $tempPos = doc.resolve(tempPos)
              const marks = $tempPos.marks()
              const hasLink = marks.some(m => m.type.name === 'link' && m.attrs.href === linkHref)
              if (hasLink) {
                end = tempPos + 1
                tempPos++
              } else {
                break
              }
            }

            // Select the link
            editor.chain().focus().setTextSelection({ from: start, to: end }).run()
          }

          // Store these values temporarily so openLinkModal can use them
          ;(window as any).__currentLinkData = {
            text: linkText,
            href: linkHref,
            position: { top: rect.bottom, left: rect.left }
          }

          toolbarRef.current?.openLinkModal()
        }, 500)
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a.custom-link')

      if (!link && currentLink) {
        currentLink = null
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          hoverTimeout = null
        }
      }
    }

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a.custom-link')

      if (link) {
        // Prevent navigation in editable mode
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('mouseover', handleMouseOver)
    editorElement.addEventListener('mouseout', handleMouseOut)
    editorElement.addEventListener('click', handleLinkClick, { capture: true })

    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout)
      editorElement.removeEventListener('mouseover', handleMouseOver)
      editorElement.removeEventListener('mouseout', handleMouseOut)
      editorElement.removeEventListener('click', handleLinkClick, { capture: true })
    }
  }, [editor, editable])

  if (!editor) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        minHeight: '200px',
        position: 'relative',
        margin: '0',
        padding: '0',
      }}
    >
      {/* Toolbar - only show in editable mode */}
      {editor && editable && <EditorToolbar ref={toolbarRef} editor={editor} theme={theme} />}

      {/* Editor Content with Drag Handle */}
      <div style={{ position: 'relative', marginTop: editable ? '24px' : '0' }}>
        {/* Drag Handle - only show in editable mode */}
        {editor && editable && (
          <DragHandle editor={editor}>
            <div
              style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
              className="drag-handle-official"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM6 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
            </div>
          </DragHandle>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
