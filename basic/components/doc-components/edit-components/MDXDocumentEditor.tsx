import React, { useRef, useEffect } from 'react'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  InsertTable,
  InsertThematicBreak,
  Separator,
  linkPlugin,
  linkDialogPlugin,
  CreateLink,
  imagePlugin,
  jsxPlugin,
  NestedLexicalEditor,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import type { MdxJsxTextElement } from 'mdast-util-mdx'
import '@mdxeditor/editor/style.css'
import '../../../styles/mdx-editor-custom.css'
import { InsertComponentDropdown } from './CustomToolbarButtons'
import { AlertBlock } from '../AlertBlock'
import { Collapse } from '../Collapse'
import { allExtensions } from './customCodeMirrorTheme'

interface MDXDocumentEditorProps {
  markdown: string
  webhookUrl: string
  authentication: string
  readOnly?: boolean
  filePath: string
  isEditingRef?: React.MutableRefObject<boolean>
  lastSaveTimeRef?: React.MutableRefObject<number>
}

export function MDXDocumentEditor({
  markdown,
  webhookUrl,
  authentication,
  readOnly = false,
  filePath,
  isEditingRef,
  lastSaveTimeRef,
}: MDXDocumentEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (newMarkdown: string) => {
    // Mark as editing
    if (isEditingRef) {
      isEditingRef.current = true
    }

    // Debounce auto-save to avoid excessive requests
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await saveToWebhook(newMarkdown)
      // Mark save time and stop editing state after save
      if (lastSaveTimeRef) {
        lastSaveTimeRef.current = Date.now()
      }
      if (isEditingRef) {
        isEditingRef.current = false
      }
    }, 1000) // Save after 1 second of inactivity
  }

  const saveToWebhook = async (content: string) => {
    if (!webhookUrl) {
      console.warn('No webhook URL configured')
      return
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authentication && { Authorization: authentication }),
        },
        body: JSON.stringify({
          file_path: filePath + '.mdx',
          new_text: content,
        }),
      })

      if (!res.ok) {
        console.error('Failed to save content:', await res.text())
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  // Add copy buttons to code blocks
  useEffect(() => {
    const addCopyButtons = () => {
      const codeBlocks = document.querySelectorAll('.mdx-editor-wrapper div[class*="codeMirrorWrapper"]')

      codeBlocks.forEach((block) => {
        // Check if copy button already exists
        if (block.querySelector('.code-copy-button')) return

        const copyButton = document.createElement('button')
        copyButton.className = 'code-copy-button'
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
        copyButton.title = 'Copy code'

        copyButton.addEventListener('click', async () => {
          const codeElement = block.querySelector('.cm-content')
          if (codeElement) {
            const code = codeElement.textContent || ''
            try {
              await navigator.clipboard.writeText(code)
              copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
              setTimeout(() => {
                copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
              }, 2000)
            } catch (err) {
              console.error('Failed to copy:', err)
            }
          }
        })

        block.appendChild(copyButton)
      })
    }

    // Run initially and on mutations
    addCopyButtons()
    const observer = new MutationObserver(addCopyButtons)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="mdx-editor-wrapper">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={handleChange}
        readOnly={readOnly}
        plugins={[
          // Core markdown plugins
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageAutocompleteSuggestions: [],
          }),
          tablePlugin(),
          codeBlockPlugin({
            defaultCodeBlockLanguage: 'js',
          }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: 'JavaScript',
              jsx: 'JavaScript (JSX)',
              ts: 'TypeScript',
              tsx: 'TypeScript (TSX)',
              javascript: 'JavaScript',
              typescript: 'TypeScript',
              css: 'CSS',
              html: 'HTML',
              json: 'JSON',
              python: 'Python',
              bash: 'Bash',
              sql: 'SQL',
              yaml: 'YAML',
              markdown: 'Markdown',
              txt: 'Plain Text',
              '': 'Plain Text',
            },
            codeMirrorExtensions: [allExtensions],
          }),

          // JSX support - NO source field to avoid auto-imports
          jsxPlugin({
            jsxComponentDescriptors: [
              {
                name: 'Info',
                kind: 'flow',
                props: [],
                hasChildren: true,
                Editor: () => {
                  return (
                    <AlertBlock type="info">
                      <NestedLexicalEditor<MdxJsxTextElement>
                        getContent={(node) => node.children}
                        getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                      />
                    </AlertBlock>
                  )
                },
              },
              {
                name: 'Tip',
                kind: 'flow',
                props: [],
                hasChildren: true,
                Editor: () => {
                  return (
                    <AlertBlock type="tip">
                      <NestedLexicalEditor<MdxJsxTextElement>
                        getContent={(node) => node.children}
                        getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                      />
                    </AlertBlock>
                  )
                },
              },
              {
                name: 'Note',
                kind: 'flow',
                props: [],
                hasChildren: true,
                Editor: () => {
                  return (
                    <AlertBlock type="note">
                      <NestedLexicalEditor<MdxJsxTextElement>
                        getContent={(node) => node.children}
                        getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                      />
                    </AlertBlock>
                  )
                },
              },
              {
                name: 'Warning',
                kind: 'flow',
                props: [],
                hasChildren: true,
                Editor: () => {
                  return (
                    <AlertBlock type="warning">
                      <NestedLexicalEditor<MdxJsxTextElement>
                        getContent={(node) => node.children}
                        getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                      />
                    </AlertBlock>
                  )
                },
              },
              {
                name: 'Danger',
                kind: 'flow',
                props: [],
                hasChildren: true,
                Editor: () => {
                  return (
                    <AlertBlock type="danger">
                      <NestedLexicalEditor<MdxJsxTextElement>
                        getContent={(node) => node.children}
                        getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                      />
                    </AlertBlock>
                  )
                },
              },
              {
                name: 'Collapse',
                kind: 'flow',
                props: [
                  { name: 'title', type: 'string' },
                  { name: 'defaultOpen', type: 'string' },
                ],
                hasChildren: true,
                Editor: ({ mdastNode }) => {
                  const titleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'title')
                  const defaultOpenAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'defaultOpen')
                  const title = titleAttr?.value || 'Details'
                  const defaultOpen = defaultOpenAttr?.value === 'true'

                  return (
                    <div contentEditable={false} style={{ margin: '16px 0' }}>
                      <Collapse title={title} defaultOpen={true}>
                        <NestedLexicalEditor<MdxJsxTextElement>
                          getContent={(node) => node.children}
                          getUpdatedMdastNode={(node, children) => ({ ...node, children })}
                        />
                      </Collapse>
                    </div>
                  )
                },
              },
            ],
          }),

          // Markdown shortcuts (##, -, **, etc.)
          markdownShortcutPlugin(),

          // Toolbar
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <Separator />
                <InsertTable />
                <InsertThematicBreak />
                <Separator />
                <InsertComponentDropdown />
              </>
            ),
          }),
        ]}
      />
    </div>
  )
}
