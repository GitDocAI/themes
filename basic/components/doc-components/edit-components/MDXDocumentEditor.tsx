import React, { useRef, useEffect, useState, createContext, useContext } from 'react'
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
  imagePlugin,
  linkDialogPlugin,
  CreateLink,
  jsxPlugin,
  NestedLexicalEditor,
  type MDXEditorMethods,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  directivesPlugin,
} from '@mdxeditor/editor'
import type { MdxJsxTextElement } from 'mdast-util-mdx'
import '@mdxeditor/editor/style.css'
import '../../../styles/mdx-editor-custom.css'
import { InsertComponentDropdown, ImageUploadButton } from './CustomToolbarButtons'
import { AlertBlock } from '../AlertBlock'
import { Collapse } from '../Collapse'
import { BasicPrimeCard } from '../Card'
import { CardModal } from './CardModal'
import { ImageEditModal } from './ImageEditModal'
import { allExtensions } from './customCodeMirrorTheme'
import { usePathname } from 'next/navigation'
import { createDescriptorsFromComponents } from './customEditComponents'
import { customTablePlugin } from './plugins/table/customTablePlugins'


// Context to share editor ref, save function, and webhook info
interface EditorContextType {
  editorRef: React.RefObject<MDXEditorMethods | null>
  saveToWebhook: (content: string) => Promise<void>
  webhookUrl: string
  authentication: string
}
const EditorContext = createContext<EditorContextType | null>(null)

const descriptors = createDescriptorsFromComponents()

// Editable Image wrapper component
const EditableImage = ({ mdastNode }: { mdastNode: any }) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const context = useContext(EditorContext)
  const editorRef = context?.editorRef
  const saveToWebhook = context?.saveToWebhook
  const webhookUrl = context?.webhookUrl || ''
  const authentication = context?.authentication || ''
  const pathname = usePathname()

  const srcAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'src')
  const altAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'alt')
  const widthAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'width')
  const heightAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'height')

  const src = srcAttr?.value || ''
  const alt = altAttr?.value || ''
  const width = widthAttr?.value
  const height = heightAttr?.value

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `screenshot_${timestamp}.${extension}`
    const assetPath = `${pathname.replace(/^\//, '')}/assets/${filename}`

    formData.append('file', file, filename)
    formData.append('file_path', assetPath)
    formData.append('is_multipart', 'true')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        ...(authentication && { Authorization: authentication }),
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    return `./assets/${filename}`
  }

  const handleUpdate = async (newAlt: string, newImagePath?: string) => {
    if (!editorRef?.current || !saveToWebhook) return

    const currentMarkdown = editorRef.current.getMarkdown()

    // Build old image markdown
    let oldImageMarkdown = '<img'
    if (src) oldImageMarkdown += `\n  src="${src}"`
    if (alt) oldImageMarkdown += `\n  alt="${alt}"`
    if (width) oldImageMarkdown += `\n  width="${width}"`
    if (height) oldImageMarkdown += `\n  height="${height}"`
    oldImageMarkdown += '\n/>'

    // Build new image markdown
    let newImageMarkdown = '<img'
    newImageMarkdown += `\n  src="${newImagePath || src}"`
    newImageMarkdown += `\n  alt="${newAlt}"`
    if (width) newImageMarkdown += `\n  width="${width}"`
    if (height) newImageMarkdown += `\n  height="${height}"`
    newImageMarkdown += '\n/>'

    // Replace in markdown
    const newMarkdown = currentMarkdown.replace(oldImageMarkdown, newImageMarkdown)
    editorRef.current.setMarkdown(newMarkdown)

    // Save to webhook
    await saveToWebhook(newMarkdown)
  }

  return (
    <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
      <button
        onClick={() => setShowEditModal(true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 1,
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        Edit
      </button>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg border border-neutral-200 dark:border-neutral-700"
        style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
      />
      {alt && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
          {alt}
        </p>
      )}
      <ImageEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdate}
        onUpload={handleUpload}
        currentSrc={src}
        currentAlt={alt}
      />
    </div>
  )
}

// Editable Card wrapper component
const EditableCard = ({ mdastNode }: { mdastNode: any }) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const context = useContext(EditorContext)
  const editorRef = context?.editorRef
  const saveToWebhook = context?.saveToWebhook

  const titleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'title')
  const subtitleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'subtitle')
  const iconAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'icon')
  const hrefAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'href')
  const imageAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'image')

  const title = titleAttr?.value || 'Card title'
  const subtitle = subtitleAttr?.value
  const icon = iconAttr?.value
  const href = hrefAttr?.value
  const image = imageAttr?.value

  // Get content from children
  const getContentText = (node: any): string => {
    if (!node.children || node.children.length === 0) return 'Card content goes here'
    const firstChild = node.children[0]
    if (firstChild.type === 'text') return firstChild.value
    if (firstChild.type === 'paragraph' && firstChild.children) {
      const textChild = firstChild.children.find((c: any) => c.type === 'text')
      return textChild?.value || 'Card content goes here'
    }
    return 'Card content goes here'
  }

  const handleUpdate = async (cardMarkdown: string) => {
    if (!editorRef?.current || !saveToWebhook) return

    // Get current markdown
    const currentMarkdown = editorRef.current.getMarkdown()

    // Build the old card markdown to find and replace
    let oldCardMarkdown = '<Card'
    if (title) oldCardMarkdown += ` title="${title}"`
    if (subtitle) oldCardMarkdown += ` subtitle="${subtitle}"`
    if (icon) oldCardMarkdown += ` icon="${icon}"`
    if (image) oldCardMarkdown += ` image="${image}"`
    if (href) oldCardMarkdown += ` href="${href}"`
    oldCardMarkdown += `>\n  ${getContentText(mdastNode)}\n</Card>`

    // Replace in markdown
    const newMarkdown = currentMarkdown.replace(oldCardMarkdown, cardMarkdown)
    editorRef.current.setMarkdown(newMarkdown)

    // Save to webhook
    await saveToWebhook(newMarkdown)
  }

  return (
    <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
      <button
        onClick={() => setShowEditModal(true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 1,
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        Edit
      </button>
      <BasicPrimeCard title={title} subtitle={subtitle} icon={icon} href={href} image={image}>
        <NestedLexicalEditor<MdxJsxTextElement>
          getContent={(node) => node.children}
          getUpdatedMdastNode={(node, children) => ({ ...node, children: children as any })}
        />
      </BasicPrimeCard>
      <CardModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onInsert={handleUpdate}
        initialData={{
          title,
          subtitle,
          icon,
          href,
          image,
          content: getContentText(mdastNode),
        }}
      />
    </div>
  )
}

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
          tablePlugin(),
          customTablePlugin(),
          linkPlugin(),
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
            codeMirrorExtensions: [allExtensions],
          }),
          // JSX support - NO source field to avoid auto-imports
          jsxPlugin({
            jsxComponentDescriptors: [
                ...descriptors,
                  {
          name: 'table',
          kind: 'flow',
          hasChildren: true,
          Editor: ({ mdastNode }) => {
            return (
              <div contentEditable={false}>
                        asasasasass
              </div>
            )
          },
        },{
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
                          getUpdatedMdastNode={(node, children) => ({ ...node, children: children as any })}
                        />
                      </Collapse>
                    </div>
                  )
                },
              },
              {
                name: 'Card',
                kind: 'flow',
                props: [
                  { name: 'title', type: 'string' },
                  { name: 'icon', type: 'string' },
                  { name: 'href', type: 'string' },
                  { name: 'img', type: 'string' },
                  { name: 'text', type: 'string' },
                ],
                hasChildren: true,
                Editor: ({ mdastNode }) => <EditableCard mdastNode={mdastNode} />,
              },
              {
                name: 'img',
                kind: 'text',
                props: [
                  { name: 'src', type: 'string' },
                  { name: 'alt', type: 'string' },
                  { name: 'width', type: 'string' },
                  { name: 'height', type: 'string' },
                ],
                hasChildren: false,
                Editor: ({ mdastNode }) => <EditableImage mdastNode={mdastNode} />,
              },
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
                  <InsertTable />
                  <InsertThematicBreak />
                  <Separator />
                  <ImageUploadButton webhookUrl={webhookUrl} authentication={authentication} />
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
