import React, { useContext, useState } from "react"
import { DataTableModal } from "./DataTableModal"
import { components } from "@/shared/mdx_components/components"

export const TableEditPlugin = (EditorContext:React.Context<any>)=>{
                return {
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
                      const saveToWebhook = context?.saveToWebhook

                      const handleDelete = async () => {
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

                        const newMarkdown = filteredLines.join('\n')
                        editorRef.current.setMarkdown(newMarkdown)

                        // Save to webhook
                        if (saveToWebhook) {
                          await saveToWebhook(newMarkdown)
                        }
                      }

                      const handleEdit = () => {
                        setShowModal(true)
                      }

                      const handleUpdate = async (newTableMarkdown: string) => {
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

                          // Save to webhook
                          if (saveToWebhook) {
                            await saveToWebhook(updated)
                          }
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
                }
}
