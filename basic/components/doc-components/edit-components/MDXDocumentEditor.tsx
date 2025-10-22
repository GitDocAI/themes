import React, { useRef, useEffect, createContext} from 'react'
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
  InsertThematicBreak,
  Separator,
  linkPlugin,
  imagePlugin,
  linkDialogPlugin,
  CreateLink,
  jsxPlugin,
  type MDXEditorMethods,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  directivesPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import '../../../styles/mdx-editor-custom.css'
import { InsertComponentDropdown } from './CustomToolbarButtons'
import { allExtensions } from './customCodeMirrorTheme'

import { createDescriptorsFromComponents } from './plugins/customEditComponents'
import { wrapCustomElements } from './plugins/remark/wrapCustomElements'


// Context to share editor ref, save function, and webhook info
interface EditorContextType {
  editorRef: React.RefObject<MDXEditorMethods | null>
  saveToWebhook: (content: string) => Promise<void>
  webhookUrl: string
  authentication: string
}
const EditorContext = createContext<EditorContextType | null>(null)

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



  useEffect(()=>{
    if (!editorRef?.current || !saveToWebhook) return
    const currentMarkdown = editorRef.current.getMarkdown()
    wrapCustomElements(currentMarkdown).then(mdx=>{
        editorRef!.current!.setMarkdown( mdx )
    })
    return ()=>{
    }
  },[])



  return (
    <EditorContext.Provider value={{ editorRef, saveToWebhook, webhookUrl, authentication }}>
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
          tablePlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          // imagePlugin disabled - images are handled as JSX components to preserve HTML format
          directivesPlugin(),
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
            codeMirrorExtensions: allExtensions,
          }),
          // JSX support - NO source field to avoid auto-imports
          jsxPlugin({
            jsxComponentDescriptors: [
                ...createDescriptorsFromComponents(EditorContext) as any,
            ],
          }),

          // Markdown shortcuts (##, -, **, etc.)
          markdownShortcutPlugin(),

          // Diff/Source plugin for mode switching
          diffSourcePlugin({
            viewMode: 'rich-text',
          }),
          // Toolbar
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <DiffSourceToggleWrapper options={['rich-text', 'source']}>
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <ListsToggle />
                  <Separator />
                  <CreateLink />
                  <Separator />
                  <InsertThematicBreak />
                  <Separator />
                  <InsertComponentDropdown />
                </DiffSourceToggleWrapper>
              </>
            ),
          }),
        ]}
      />
      </div>
    </EditorContext.Provider>
  )
}
