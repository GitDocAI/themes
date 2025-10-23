import React, { useContext, useState } from "react"
import { components } from "@/shared/mdx_components/components"

export const AccordionEditPlugin = (EditorContext: React.Context<any>) => {
  return {
    name: 'Accordion',
    kind: 'flow',
    props: [
      { name: 'multiple', type: 'string' },
      { name: 'activeIndex', type: 'expression' },
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
              props[attr.name] = attr.value === null ? true : attr.value
            }
          }
        }
        return props
      }

      // Extract accordion tabs from children
      const extractTabs = (node: any) => {
        const tabs: any[] = []

        if (!node.children) return tabs

        node.children.forEach((child: any) => {
          if (child.type === 'mdxJsxFlowElement' && child.name === 'AccordionTab') {
            const tab: any = { header: '', content: '' }

            // Extract header from attributes
            if (child.attributes && Array.isArray(child.attributes)) {
              for (const attr of child.attributes) {
                if (attr.name === 'header') {
                  tab.header = attr.value
                }
              }
            }

            // Extract content
            tab.content = extractContent(child)

            tabs.push(tab)
          }
        })

        return tabs
      }

      const extractContent = (tabNode: any): string => {
        if (!tabNode.children) return ''

        const textParts: string[] = []

        const traverse = (node: any) => {
          if (node.type === 'text') {
            textParts.push(node.value)
          } else if (node.type === 'paragraph' && node.children) {
            node.children.forEach((child: any) => traverse(child))
            textParts.push('\n')
          } else if (node.children) {
            node.children.forEach((child: any) => traverse(child))
          }
        }

        tabNode.children.forEach((child: any) => traverse(child))
        return textParts.join('').trim()
      }

      const AccordionWrapper = () => {
        const [isEditing, setIsEditing] = useState(false)
        const [isHovering, setIsHovering] = useState(false)
        const [editData, setEditData] = useState({
          multiple: extractProps(mdastNode).multiple || false,
          activeIndex: extractProps(mdastNode).activeIndex,
          tabs: extractTabs(mdastNode)
        })

        const context = useContext(EditorContext)
        const editorRef = context?.editorRef

        const handleDelete = () => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()

          const lines = currentMarkdown.split('\n')
          let inAccordion = false
          let filteredLines: string[] = []

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('<Accordion')) {
              inAccordion = true
              continue
            }
            if (inAccordion && lines[i].trim() === '</Accordion>') {
              inAccordion = false
              continue
            }
            if (!inAccordion) {
              filteredLines.push(lines[i])
            }
          }

          editorRef.current.setMarkdown(filteredLines.join('\n'))
        }

        const handleSave = () => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()

          // Generate new markdown
          const props: string[] = []
          if (editData.multiple) props.push('multiple')
          if (editData.activeIndex !== undefined) {
            const indexValue = typeof editData.activeIndex === 'string'
              ? editData.activeIndex
              : JSON.stringify(editData.activeIndex)
            props.push(`activeIndex={${indexValue}}`)
          }

          const propsStr = props.length > 0 ? ' ' + props.join(' ') : ''

          const tabs = editData.tabs.map((tab: any) => {
            return `  <AccordionTab header="${tab.header}">
    ${tab.content}
  </AccordionTab>`
          }).join('\n')

          const newMarkdown = `<Accordion${propsStr}>
${tabs}
</Accordion>`

          // Replace old with new
          const lines = currentMarkdown.split('\n')
          let inAccordion = false
          let startIndex = -1
          let endIndex = -1

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('<Accordion')) {
              inAccordion = true
              startIndex = i
            }
            if (inAccordion && lines[i].trim() === '</Accordion>') {
              endIndex = i
              break
            }
          }

          if (startIndex !== -1 && endIndex !== -1) {
            const before = lines.slice(0, startIndex)
            const after = lines.slice(endIndex + 1)
            const updated = [...before, newMarkdown, ...after].join('\n')
            editorRef.current.setMarkdown(updated)
          }

          setIsEditing(false)
        }

        const handleCancel = () => {
          setEditData({
            multiple: extractProps(mdastNode).multiple || false,
            activeIndex: extractProps(mdastNode).activeIndex,
            tabs: extractTabs(mdastNode)
          })
          setIsEditing(false)
        }

        const addTab = () => {
          setEditData({
            ...editData,
            tabs: [...editData.tabs, { header: 'New Tab', content: '' }]
          })
        }

        const removeTab = (index: number) => {
          if (editData.tabs.length > 1) {
            setEditData({
              ...editData,
              tabs: editData.tabs.filter((_: any, i: number) => i !== index)
            })
          }
        }

        const updateTab = (index: number, field: string, value: string) => {
          const newTabs = [...editData.tabs]
          newTabs[index] = { ...newTabs[index], [field]: value }
          setEditData({ ...editData, tabs: newTabs })
        }

        const moveTab = (index: number, direction: 'up' | 'down') => {
          const newTabs = [...editData.tabs]
          const targetIndex = direction === 'up' ? index - 1 : index + 1

          if (targetIndex < 0 || targetIndex >= newTabs.length) return

          [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]]
          setEditData({ ...editData, tabs: newTabs })
        }

        if (isEditing) {
          return (
            <div
              contentEditable={false}
              suppressContentEditableWarning={true}
              style={{
                margin: '16px 0',
                userSelect: 'none',
                border: '2px solid rgb(var(--color-primary))',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#f8f9fa'
              }}
            >
              {/* Edit Mode Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Editing Accordion</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      backgroundColor: 'rgb(var(--color-primary))',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Accordion Settings */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>Settings</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editData.multiple}
                        onChange={(e) => setEditData({ ...editData, multiple: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      Allow Multiple Tabs Open
                    </label>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h5 style={{ margin: 0, fontSize: '0.875rem' }}>Accordion Tabs</h5>
                  <button
                    onClick={addTab}
                    style={{
                      backgroundColor: 'rgb(var(--color-primary))',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="pi pi-plus" style={{ fontSize: '0.75rem' }}></i>
                    Add Tab
                  </button>
                </div>

                {editData.tabs.map((tab: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '0.875rem' }}>Tab {index + 1}</strong>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {index > 0 && (
                          <button
                            onClick={() => moveTab(index, 'up')}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#6c757d',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Move Up"
                          >
                            <i className="pi pi-arrow-up"></i>
                          </button>
                        )}
                        {index < editData.tabs.length - 1 && (
                          <button
                            onClick={() => moveTab(index, 'down')}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#6c757d',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Move Down"
                          >
                            <i className="pi pi-arrow-down"></i>
                          </button>
                        )}
                        {editData.tabs.length > 1 && (
                          <button
                            onClick={() => removeTab(index)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#dc3545',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Delete Tab"
                          >
                            <i className="pi pi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 500 }}>
                        Header *
                      </label>
                      <input
                        type="text"
                        value={tab.header}
                        onChange={(e) => updateTab(index, 'header', e.target.value)}
                        placeholder="Tab header"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 500 }}>
                        Content *
                      </label>
                      <textarea
                        value={tab.content}
                        onChange={(e) => updateTab(index, 'content', e.target.value)}
                        placeholder="Tab content"
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // View mode
        const tabs = extractTabs(mdastNode)
        const accordionProps = extractProps(mdastNode)

        return (
          <div
            contentEditable={false}
            suppressContentEditableWarning={true}
            style={{ margin: '16px 0', userSelect: 'none', position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Action buttons */}
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
                onClick={() => setIsEditing(true)}
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
                title="Edit Accordion"
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
                title="Delete Accordion"
              >
                <i className="pi pi-trash" style={{ fontSize: '0.875rem' }}></i>
                Delete
              </button>
            </div>

            <components.Accordion {...accordionProps}>
              {tabs.map((tab: any, index: number) => (
                <components.AccordionTab key={index} header={tab.header}>
                  {tab.content}
                </components.AccordionTab>
              ))}
            </components.Accordion>
          </div>
        )
      }

      return <AccordionWrapper />
    },
  }
}
