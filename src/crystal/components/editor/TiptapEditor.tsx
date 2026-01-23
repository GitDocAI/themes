import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import NodeRange from '@tiptap/extension-node-range'
import { useEffect, useRef, useState, useCallback } from 'react'
import Emoji, { gitHubEmojis } from '@tiptap/extension-emoji'
import './tiptap.css'
import './types'

// Import serializer and parser for code mode
import { mdxSerializer } from '../../../services/mdxSerializer'
import { mdxParser } from '../../../services/mdxParser'

// Import code editor with syntax highlighting
import Editor from 'react-simple-code-editor'
import { codeToHtml } from 'shiki'

// Import custom extensions
import { CardBlock } from './extensions/CardBlock'
import { AccordionBlock, AccordionTab } from './extensions/AccordionBlock'
import { TabsBlock, TabBlock } from './extensions/TabsBlock'
import { TableBlock } from './extensions/TableBlock'
import { ImageBlock } from './extensions/ImageBlock'
import { EndpointBlock } from './extensions/EndpointBlock'
import { LabelBlock } from './extensions/LabelBlock'
import { ParamBlock } from './extensions/ParamBlock'
import { StepsBlock, StepBlock } from './extensions/StepsBlock'
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
import suggestion  from './emoji/suggestion'

// Import toolbar
import { EditorToolbar } from './EditorToolbar'
import type { EditorToolbarRef } from './EditorToolbar'
import { HorizontalRuleBlock } from './extensions/HorizontalRuleBlock'

interface TiptapEditorProps {
  content: any // Tiptap JSON format
  theme: 'light' | 'dark'
  onUpdate: (content: any) => void
  editable?: boolean
  allowUpload?: boolean
  minHeight?: string
  initialMdx?: string // Raw MDX content for code editor when there's a parse error
  initialParseError?: string // Initial parse error message
  onParseErrorChange?: (hasError: boolean) => void // Called when parse error state changes
}

// Suppress flushSync warning from Tiptap (known issue with React 18+)
const originalError = console.error
console.error = (...args) => {
  if (args[0]?.includes?.('flushSync was called from inside a lifecycle method')) {
    return
  }
  originalError.apply(console, args)
}

// Helper to extract line number from error message
const extractLineFromError = (message: string): number | null => {
  const lineMatch = message.match(/\((\d+):\d+(?:-\d+:\d+)?\)/) ||  // (346:1-346:13) or (346:1)
                    message.match(/^(\d+):\d+:/) ||                  // 1:1: at start
                    message.match(/(?:at line |line )\s*(\d+)/i) ||  // at line X, line X
                    message.match(/position (\d+)/i)
  return lineMatch ? parseInt(lineMatch[1], 10) : null
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, theme, onUpdate, editable = true, allowUpload = false, minHeight = '200px', initialMdx, initialParseError, onParseErrorChange }) => {
  const toolbarRef = useRef<EditorToolbarRef>(null)

  // Editor mode state (visual or code) - start in code mode if there's an initial parse error
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(initialParseError ? 'code' : 'visual')
  const [mdxCode, setMdxCode] = useState<string>(initialMdx || '')
  const [parseError, setParseError] = useState<string | null>(initialParseError || null)
  const [errorLine, setErrorLine] = useState<number | null>(initialParseError ? extractLineFromError(initialParseError) : null)
  const [isSwitching, setIsSwitching] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>('')
  const [isValidating, setIsValidating] = useState(false)
  const validationTimeoutRef = useRef<number | null>(null)

  // Notify parent when parse error state changes
  useEffect(() => {
    onParseErrorChange?.(!!parseError)
  }, [parseError, onParseErrorChange])

  // Highlight code using Shiki with error line highlighting
  const highlightCode = useCallback(async (code: string, errLine: number | null) => {
    try {
      const html = await codeToHtml(code, {
        lang: 'mdx',
        theme: theme === 'dark' ? 'github-dark' : 'github-light',
      })
      // Extract just the code content from Shiki's output
      const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
      const highlighted = match ? match[1] : code

      // If there's an error line, wrap that line with error highlighting
      if (errLine) {
        const lines = highlighted.split('\n')
        const withErrorHighlight = lines.map((line, index) => {
          const lineNum = index + 1
          if (lineNum === errLine) {
            const bgColor = theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.12)'
            return `<span style="display:block;background:${bgColor};margin:0 -20px;padding:0 20px;border-left:3px solid ${theme === 'dark' ? '#f87171' : '#dc2626'};">${line}</span>`
          }
          return line
        }).join('\n')
        setHighlightedCode(withErrorHighlight)
      } else {
        setHighlightedCode(highlighted)
      }
    } catch {
      // Fallback to plain text if highlighting fails
      setHighlightedCode(code.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    }
  }, [theme])

  // Update highlighting when code, theme, or error line changes
  useEffect(() => {
    if (editorMode === 'code' && mdxCode) {
      highlightCode(mdxCode, errorLine)
    }
  }, [mdxCode, theme, editorMode, errorLine, highlightCode])

  // Validate MDX code and detect errors
  // Also updates editor content when validation succeeds (so saves work from code mode)
  const validateCode = useCallback(async (code: string, editorInstance: ReturnType<typeof useEditor> | null) => {
    if (!code.trim()) {
      setParseError(null)
      setErrorLine(null)
      return
    }

    setIsValidating(true)
    try {
      const result = await mdxParser.parse(code)

      if (result.parseError) {
        setParseError(result.parseError)
        setErrorLine(extractLineFromError(result.parseError))
      } else if (result.doc) {
        setParseError(null)
        setErrorLine(null)
        onParseErrorChange?.(false)
        // Update editor content so saves work from code mode
        if (editorInstance && !editorInstance.isDestroyed) {
          editorInstance.commands.setContent(result.doc, { emitUpdate: true })
        }
      }
    } catch (error: any) {
      const message = error.message || 'Unknown error'
      setParseError(message)
      setErrorLine(extractLineFromError(message))
    } finally {
      setIsValidating(false)
    }
  }, [onParseErrorChange])

  const editor = useEditor({
    extensions: [
      Emoji.configure({
        emojis: gitHubEmojis,
        enableEmoticons: true,
        forceFallbackImages: true,
        suggestion,
      }),
      StarterKit.configure({
        heading: false, // Disable default heading to use custom one
        horizontalRule: false,
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
      HorizontalRuleBlock,
      EndpointBlock,
      LabelBlock,
      ParamBlock,
      StepsBlock,
      StepBlock,
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
        // Defer setContent to avoid flushSync warning in React 18+
        queueMicrotask(() => {
          if (!editor.isDestroyed) {
            editor.commands.setContent(content, { emitUpdate: false })
          }
        })
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

  // Handle mode toggle between visual and code
  const handleModeToggle = useCallback(async () => {
    if (!editor || isSwitching) return

    setIsSwitching(true)

    try {
      if (editorMode === 'visual') {
        // Visual → Code: serialize current content to MDX
        // BUT only if there's no parse error (if there's an error, editor content is invalid/empty)
        if (!parseError) {
          const json = editor.getJSON()
          const mdx = mdxSerializer.serialize(json)
          setMdxCode(mdx)
        }
        // Keep mdxCode as-is if there's a parse error (it still has the original content)
        setEditorMode('code')
      } else {
        // Code → Visual: parse MDX and update content
        try {
          const result = await mdxParser.parse(mdxCode)
          if (result.parseError) {
            // Parse failed - keep error state but still switch to visual
            setParseError(result.parseError)
            setErrorLine(extractLineFromError(result.parseError))
          } else if (result.doc) {
            // Parse succeeded - clear error FIRST, then update content
            // This ensures hasParseErrorRef is updated before onUpdate fires
            setParseError(null)
            setErrorLine(null)
            onParseErrorChange?.(false) // Notify parent synchronously

            await new Promise<void>((resolve) => {
              setTimeout(() => {
                if (!editor.isDestroyed) {
                  editor.commands.setContent(result.doc, { emitUpdate: true })
                }
                resolve()
              }, 0)
            })
          }
        } catch (error: any) {
          // Parse exception - keep error state
          const message = error.message || 'Unknown error'
          setParseError(message)
          setErrorLine(extractLineFromError(message))
        }
        setEditorMode('visual')
      }
    } finally {
      setIsSwitching(false)
    }
  }, [editor, editorMode, mdxCode, isSwitching, parseError])

  // Handle code changes in code mode
  const handleCodeChange = useCallback((code: string) => {
    setMdxCode(code)

    // Debounced validation (500ms delay)
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    validationTimeoutRef.current = window.setTimeout(() => {
      validateCode(code, editor)
    }, 500)
  }, [validateCode, editor])

  // Cleanup validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

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
      {editor && editable && (
        <EditorToolbar
          ref={toolbarRef}
          editor={editor}
          theme={theme}
          editorMode={editorMode}
          onModeToggle={handleModeToggle}
          isSwitching={isSwitching}
        />
      )}

      {/* Floating error notification */}
      {editable && editorMode === 'code' && parseError && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            maxWidth: '400px',
            padding: '12px 16px',
            backgroundColor: theme === 'light' ? '#fef2f2' : '#450a0a',
            border: `1px solid ${theme === 'light' ? '#fecaca' : '#7f1d1d'}`,
            borderRadius: '8px',
            color: theme === 'light' ? '#dc2626' : '#fca5a5',
            fontSize: '13px',
            boxShadow: theme === 'light'
              ? '0 4px 12px rgba(0, 0, 0, 0.15)'
              : '0 4px 12px rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            animation: 'slideIn 0.2s ease-out',
          }}
        >
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <i className="pi pi-exclamation-triangle" style={{ marginTop: '2px', flexShrink: 0 }}></i>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                Parse Error{errorLine ? ` (Line ${errorLine})` : ''}
              </div>
              <div style={{
                fontSize: '12px',
                opacity: 0.9,
                wordBreak: 'break-word',
                maxHeight: '80px',
                overflow: 'auto',
              }}>
                {parseError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Editor - show when in code mode */}
      {editable && editorMode === 'code' && (
        <div style={{ marginTop: '24px' }}>
          {/* Status bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isValidating ? (
                <span style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
                  <i className="pi pi-spin pi-spinner" style={{ marginRight: '6px' }}></i>
                  Validating...
                </span>
              ) : parseError ? (
                <span style={{ color: theme === 'light' ? '#dc2626' : '#fca5a5' }}>
                  <i className="pi pi-times-circle" style={{ marginRight: '6px' }}></i>
                  Error{errorLine ? ` on line ${errorLine}` : ''}
                </span>
              ) : null}
            </div>
            <span style={{ color: theme === 'light' ? '#9ca3af' : '#6b7280' }}>
              {mdxCode.split('\n').length} lines
            </span>
          </div>

          {/* Code editor with syntax highlighting */}
          <div
            className={theme === 'dark' ? 'dark-code-editor' : ''}
            style={{
              border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`,
              borderRadius: '8px',
              backgroundColor: theme === 'light' ? '#f8fafc' : '#0f172a',
              overflow: 'auto',
            }}
          >
            {/* <Editor */}
            {/*   value={mdxCode} */}
            {/*   onValueChange={handleCodeChange} */}
            {/*   highlight={(code) => highlightedCode || code.replace(/</g, '&lt;').replace(/>/g, '&gt;')} */}
            {/*   padding={20} */}
            {/*   textareaId="code-editor-textarea" */}
            {/*   style={{ */}
            {/*     fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace', */}
            {/*     fontSize: '14px', */}
            {/*     minHeight: '300px', */}
            {/*     backgroundColor: 'transparent', */}
            {/*     whiteSpace: 'pre-wrap', */}
            {/*     wordBreak: 'break-word', */}
            {/*   }} */}
            {/*   textareaClassName="code-editor-textarea" */}
            {/*   preClassName="code-editor-pre" */}
            {/* /> */}
          </div>
        </div>
      )}

      {/* Visual Editor Content with Drag Handle - hide when in code mode */}
      {editorMode === 'visual' && (
        <div style={{ position: 'relative', marginTop: editable ? '24px' : '0' }}>
          {/* Show error card if there's a parse error */}
          {parseError ? (
            <div
              style={{
                padding: '24px',
                backgroundColor: theme === 'dark' ? '#451a1a' : '#fef2f2',
                border: `1px solid ${theme === 'dark' ? '#7f1d1d' : '#fecaca'}`,
                borderRadius: '8px',
                color: theme === 'dark' ? '#fca5a5' : '#991b1b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    fill={theme === 'dark' ? '#f87171' : '#dc2626'}
                  />
                </svg>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  MDX Parsing Error
                </h3>
              </div>

              <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.5 }}>
                There was an error parsing this page. Switch to Code mode to fix the errors.
              </p>

              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                  color: '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {parseError}
              </pre>

              <p style={{ margin: '12px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
                Common issues: unclosed tags, missing closing brackets, or invalid JSX syntax.
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
