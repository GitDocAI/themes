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
import { InsertComponentDropdown } from './CustomToolbarButtons'
import { AlertBlock } from '../AlertBlock'
import { Collapse } from '../Collapse'
import { BasicPrimeCard } from '../Card'
import { CardModal } from './CardModal'
import { ImageEditModal } from './ImageEditModal'
import { DataTableModal } from './DataTableModal'
import { allExtensions } from './customCodeMirrorTheme'
import { usePathname } from 'next/navigation'
import { createDescriptorsFromComponents } from './customEditComponents'
import { customTablePlugin } from './plugins/table/customTablePlugins'
import { components } from '@/shared/mdx_components/components'


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
            codeMirrorExtensions: allExtensions,
          }),
          // JSX support - NO source field to avoid auto-imports
          jsxPlugin({
            jsxComponentDescriptors: [
                ...descriptors.filter((d: any) => d.name !== 'DataTable'),
                {
                  name: 'DataTable',
                  kind: 'flow',
                  props: [
                    { name: 'paginator', type: 'string' },
                    { name: 'rows', type: 'expression' },
                    { name: 'rowsPerPageOptions', type: 'expression' },
                    { name: 'scrollable', type: 'string' },
                    { name: 'scrollHeight', type: 'string' },
                  ],
                  hasChildren: true,
                  Editor: ({ mdastNode }: any) => {
                    // Extract props from mdastNode attributes
                    const extractProps = (node: any) => {
                      const props: Record<string, any> = {}
                      if (node.attributes && Array.isArray(node.attributes)) {
                        for (const attr of node.attributes) {
                          if (attr.value?.type === "mdxJsxAttributeValueExpression") {
                            try {
                              props[attr.name] = JSON.parse(attr.value?.value)
                            } catch {
                              props[attr.name] = attr.value?.value
                            }
                          } else {
                            // Boolean attributes (like paginator) have null value
                            props[attr.name] = attr.value === null ? true : attr.value
                          }
                        }
                      }
                      console.log('DataTable extractProps:', props)
                      return props
                    }

                    // Convert mdast table to React elements
                    const convertTableToReact = (tableNode: any) => {
                      if (!tableNode || tableNode.type !== 'table') return null

                      const rows = tableNode.children || []
                      if (rows.length === 0) return null

                      // First row is header
                      const headerRow = rows[0]
                      const dataRows = rows.slice(1)

                      // Extract text from cell
                      const getCellText = (cell: any): string => {
                        if (!cell.children) return ''
                        return cell.children
                          .map((child: any) => child.value || '')
                          .join('')
                      }

                      return (
                        <table>
                          <thead>
                            <tr>
                              {headerRow.children?.map((cell: any, i: number) => (
                                <th key={i}>{getCellText(cell)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataRows.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex}>
                                {row.children?.map((cell: any, cellIndex: number) => (
                                  <td key={cellIndex}>{getCellText(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    }

                    const tableNode = mdastNode.children?.find((child: any) => child.type === 'table')
                    const tableReact = convertTableToReact(tableNode)

                    const DataTableWrapper = () => {
                      const [showModal, setShowModal] = useState(false)
                      const [isHovering, setIsHovering] = useState(false)
                      const context = useContext(EditorContext)
                      const editorRef = context?.editorRef

                      const handleDelete = () => {
                        if (!editorRef?.current) return
                        const currentMarkdown = editorRef.current.getMarkdown()
                        // Find and remove this DataTable from markdown
                        // This is a simple approach - we'll improve it if needed
                        const lines = currentMarkdown.split('\n')
                        let inDataTable = false
                        let filteredLines: string[] = []

                        for (let i = 0; i < lines.length; i++) {
                          if (lines[i].trim().startsWith('<DataTable')) {
                            inDataTable = true
                            continue
                          }
                          if (inDataTable && lines[i].trim() === '</DataTable>') {
                            inDataTable = false
                            continue
                          }
                          if (!inDataTable) {
                            filteredLines.push(lines[i])
                          }
                        }

                        editorRef.current.setMarkdown(filteredLines.join('\n'))
                      }

                      const handleEdit = () => {
                        setShowModal(true)
                      }

                      const handleUpdate = (newTableMarkdown: string) => {
                        if (!editorRef?.current) return
                        const currentMarkdown = editorRef.current.getMarkdown()
                        // Replace the old DataTable with the new one
                        const lines = currentMarkdown.split('\n')
                        let inDataTable = false
                        let startIndex = -1
                        let endIndex = -1

                        for (let i = 0; i < lines.length; i++) {
                          if (lines[i].trim().startsWith('<DataTable')) {
                            inDataTable = true
                            startIndex = i
                          }
                          if (inDataTable && lines[i].trim() === '</DataTable>') {
                            endIndex = i
                            break
                          }
                        }

                        if (startIndex !== -1 && endIndex !== -1) {
                          const before = lines.slice(0, startIndex)
                          const after = lines.slice(endIndex + 1)
                          const updated = [...before, newTableMarkdown, ...after].join('\n')
                          editorRef.current.setMarkdown(updated)
                        }

                        setShowModal(false)
                      }

                      return (
                        <>
                          <div
                            contentEditable={false}
                            suppressContentEditableWarning={true}
                            style={{ margin: '16px 0', userSelect: 'none', position: 'relative' }}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                          >
                            {/* Action buttons - positioned over table at top-right, show on hover */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                zIndex: 10,
                                display: 'flex',
                                gap: '8px',
                                opacity: isHovering ? 1 : 0,
                                pointerEvents: isHovering ? 'auto' : 'none',
                                transition: 'opacity 0.2s'
                              }}
                            >
                              <button
                                onClick={handleEdit}
                                style={{
                                  backgroundColor: 'rgb(var(--color-primary))',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                title="Edit Table"
                              >
                                <i className="pi pi-pencil" style={{ fontSize: '0.875rem' }}></i>
                                Edit
                              </button>
                              <button
                                onClick={handleDelete}
                                style={{
                                  backgroundColor: 'rgb(220, 38, 38)',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                                title="Delete Table"
                              >
                                <i className="pi pi-trash" style={{ fontSize: '0.875rem' }}></i>
                                Delete
                              </button>
                            </div>

                            <components.DataTable {...extractProps(mdastNode)}>
                              {tableReact}
                            </components.DataTable>
                          </div>

                          {/* Edit Modal */}
                          {showModal && (
                            <DataTableModal
                              isOpen={showModal}
                              onClose={() => setShowModal(false)}
                              onInsert={handleUpdate}
                              initialData={extractTableData(mdastNode)}
                            />
                          )}
                        </>
                      )
                    }

                    // Extract table data from mdastNode for editing
                    const extractTableData = (node: any) => {
                      const tableNode = node.children?.find((child: any) => child.type === 'table')
                      if (!tableNode) return undefined

                      const rows = tableNode.children || []
                      const headerRow = rows[0]
                      const dataRows = rows.slice(1)

                      const getCellText = (cell: any): string => {
                        if (!cell.children) return ''
                        return cell.children.map((child: any) => child.value || '').join('')
                      }

                      // Parse headers with metadata
                      const columns = headerRow.children?.map((cell: any, index: number) => {
                        const headerText = getCellText(cell)
                        const parsed = parseHeaderMetadata(headerText)
                        return {
                          field: `column${index + 1}`,
                          header: parsed.name,
                          sortable: parsed.props.sortable || false,
                          filter: parsed.props.filter || false
                        }
                      }) || []

                      // Build rows data
                      const rowsData = dataRows.map((row: any) => {
                        const rowObj: Record<string, any> = {}
                        row.children?.forEach((cell: any, cellIndex: number) => {
                          rowObj[`column${cellIndex + 1}`] = getCellText(cell)
                        })
                        return rowObj
                      })

                      return { columns, rows: rowsData }
                    }

                    const parseHeaderMetadata = (headerText: string): { name: string; props: Record<string, any> } => {
                      const metadataRegex = /^(.+?)::(.+)$/
                      const match = headerText.match(metadataRegex)

                      if (!match) {
                        return { name: headerText.trim(), props: {} }
                      }

                      const name = match[1].trim()
                      const metadataStr = match[2].trim()
                      const props: Record<string, any> = {}

                      const tokens = metadataStr.split(',').map(t => t.trim()).filter(t => t.length > 0)

                      tokens.forEach((token) => {
                        const equalIndex = token.indexOf('=')

                        if (equalIndex === -1) {
                          props[token] = true
                        } else {
                          const key = token.substring(0, equalIndex).trim()
                          const value = token.substring(equalIndex + 1).trim()

                          if (value === 'true') {
                            props[key] = true
                          } else if (value === 'false') {
                            props[key] = false
                          } else if (!isNaN(Number(value)) && value !== '') {
                            props[key] = Number(value)
                          } else {
                            props[key] = value
                          }
                        }
                      })

                      return { name, props }
                    }

                    return <DataTableWrapper />
                  },
                },
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
