import React, { useContext, useState } from "react"
import { components } from "@/shared/mdx_components/components"

export const TimelineEditPlugin = (EditorContext: React.Context<any>) => {
  return {
    name: 'Timeline',
    kind: 'flow',
    props: [
      { name: 'layout', type: 'string' },
      { name: 'align', type: 'string' },
      { name: 'opposite', type: 'string' },
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

      // Extract timeline events from children
      const extractEvents = (node: any) => {
        const events: any[] = []

        if (!node.children) return events

        node.children.forEach((child: any) => {
          if (child.type === 'mdxJsxFlowElement' && child.name === 'TimelineItem') {
            const event: any = {}

            if (child.attributes && Array.isArray(child.attributes)) {
              for (const attr of child.attributes) {
                if (attr.value?.type === "mdxJsxAttributeValueExpression") {
                  try {
                    event[attr.name] = JSON.parse(attr.value?.value)
                  } catch {
                    event[attr.name] = attr.value?.value
                  }
                } else {
                  event[attr.name] = attr.value
                }
              }
            }

            const content = extractContent(child)
            event.content = content

            events.push(event)
          }
        })

        return events
      }

      const extractContent = (itemNode: any): string => {
        if (!itemNode.children) return ''

        const textParts: string[] = []

        const traverse = (node: any) => {
          if (node.type === 'text') {
            textParts.push(node.value)
          } else if (node.type === 'paragraph' && node.children) {
            node.children.forEach((child: any) => traverse(child))
          } else if (node.children) {
            node.children.forEach((child: any) => traverse(child))
          }
        }

        itemNode.children.forEach((child: any) => traverse(child))
        return textParts.join(' ').trim()
      }

      const TimelineWrapper = () => {
        const [isEditing, setIsEditing] = useState(false)
        const [isHovering, setIsHovering] = useState(false)
        const [editData, setEditData] = useState({
          layout: extractProps(mdastNode).layout || 'vertical',
          align: extractProps(mdastNode).align || 'left',
          opposite: extractProps(mdastNode).opposite || false,
          events: extractEvents(mdastNode)
        })

        const context = useContext(EditorContext)
        const editorRef = context?.editorRef

        const handleDelete = () => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()

          const lines = currentMarkdown.split('\n')
          let inTimeline = false
          let filteredLines: string[] = []

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('<BasicTimeline')) {
              inTimeline = true
              continue
            }
            if (inTimeline && lines[i].trim() === '</BasicTimeline>') {
              inTimeline = false
              continue
            }
            if (!inTimeline) {
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
          if (editData.layout !== 'vertical') props.push(`layout="${editData.layout}"`)
          if (editData.align !== 'left') props.push(`align="${editData.align}"`)
          if (editData.opposite) props.push('opposite')

          const propsStr = props.length > 0 ? ' ' + props.join(' ') : ''

          const items = editData.events.map((event: any) => {
            const itemProps: string[] = []

            if (event.icon) itemProps.push(`icon="${event.icon}"`)
            if (event.color) itemProps.push(`color="${event.color}"`)
            if (event.date) itemProps.push(`date="${event.date}"`)
            if (event.title) itemProps.push(`title="${event.title}"`)
            if (event.image) itemProps.push(`image="${event.image}"`)

            const itemPropsStr = itemProps.length > 0 ? ' ' + itemProps.join(' ') : ''

            return `  <TimelineItem${itemPropsStr}>
    ${event.content || ''}
  </TimelineItem>`
          }).join('\n')

          const newMarkdown = `<BasicTimeline${propsStr}>
${items}
</BasicTimeline>`

          // Replace old with new
          const lines = currentMarkdown.split('\n')
          let inTimeline = false
          let startIndex = -1
          let endIndex = -1

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('<BasicTimeline')) {
              inTimeline = true
              startIndex = i
            }
            if (inTimeline && lines[i].trim() === '</BasicTimeline>') {
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
            layout: extractProps(mdastNode).layout || 'vertical',
            align: extractProps(mdastNode).align || 'left',
            opposite: extractProps(mdastNode).opposite || false,
            events: extractEvents(mdastNode)
          })
          setIsEditing(false)
        }

        const addEvent = () => {
          setEditData({
            ...editData,
            events: [...editData.events, { content: '', title: '', date: '', icon: '', color: '', image: '' }]
          })
        }

        const removeEvent = (index: number) => {
          if (editData.events.length > 1) {
            setEditData({
              ...editData,
              events: editData.events.filter((_: any, i: number) => i !== index)
            })
          }
        }

        const updateEvent = (index: number, field: string, value: string) => {
          const newEvents = [...editData.events]
          newEvents[index] = { ...newEvents[index], [field]: value }
          setEditData({ ...editData, events: newEvents })
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
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Editing Timeline</h4>
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

              {/* Timeline Settings */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.875rem' }}>Settings</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 500 }}>Layout</label>
                    <select
                      value={editData.layout}
                      onChange={(e) => setEditData({ ...editData, layout: e.target.value })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 500 }}>Align</label>
                    <select
                      value={editData.align}
                      onChange={(e) => setEditData({ ...editData, align: e.target.value })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="alternate">Alternate</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', fontWeight: 500 }}>Show Opposite</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '34px' }}>
                      <input
                        type="checkbox"
                        checked={editData.opposite}
                        onChange={(e) => setEditData({ ...editData, opposite: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '0.875rem' }}>Enable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h5 style={{ margin: 0, fontSize: '0.875rem' }}>Events</h5>
                  <button
                    onClick={addEvent}
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
                    Add Event
                  </button>
                </div>

                {editData.events.map((event: any, index: number) => (
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
                      <strong style={{ fontSize: '0.875rem' }}>Event {index + 1}</strong>
                      {editData.events.length > 1 && (
                        <button
                          onClick={() => removeEvent(index)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#dc3545',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="pi pi-trash"></i>
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Title</label>
                        <input
                          type="text"
                          value={event.title || ''}
                          onChange={(e) => updateEvent(index, 'title', e.target.value)}
                          placeholder="Event title"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Date</label>
                        <input
                          type="text"
                          value={event.date || ''}
                          onChange={(e) => updateEvent(index, 'date', e.target.value)}
                          placeholder="Event date"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Icon</label>
                        <input
                          type="text"
                          value={event.icon || ''}
                          onChange={(e) => updateEvent(index, 'icon', e.target.value)}
                          placeholder="pi pi-check"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Color</label>
                        <input
                          type="text"
                          value={event.color || ''}
                          onChange={(e) => updateEvent(index, 'color', e.target.value)}
                          placeholder="#6366f1"
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Image URL</label>
                        <input
                          type="text"
                          value={event.image || ''}
                          onChange={(e) => updateEvent(index, 'image', e.target.value)}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Content *</label>
                      <textarea
                        value={event.content || ''}
                        onChange={(e) => updateEvent(index, 'content', e.target.value)}
                        placeholder="Event content"
                        rows={3}
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
        const events = extractEvents(mdastNode)
        const timelineProps = extractProps(mdastNode)

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
                title="Edit Timeline"
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
                title="Delete Timeline"
              >
                <i className="pi pi-trash" style={{ fontSize: '0.875rem' }}></i>
                Delete
              </button>
            </div>

            <components.Timeline events={events} {...timelineProps} />
          </div>
        )
      }

      return <TimelineWrapper />
    },
  }
}
