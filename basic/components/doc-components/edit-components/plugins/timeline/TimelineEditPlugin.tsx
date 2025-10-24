'use client'

import React, { useContext, useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { components } from '@/shared/mdx_components/components'
import type { TimelineEvent, TimelineProps } from '@/components/doc-components/Timeline'
import { EventEditor } from './EventEditor'

export const TimelineEditPlugin = (EditorContext: React.Context<any>) => {
  return {
    name: 'Timeline',
    kind: 'flow',
    props: [
      { name: 'layout', type: 'string' },
      { name: 'align', type: 'string' },
      { name: 'opposite', type: 'boolean' },
      { name: 'events', type: 'expression' },
    ],
    hasChildren: false,
    Editor: ({ mdastNode }: any) => {
      const extractProps = (node: any): Partial<TimelineProps> => {
        const props: Record<string, any> = {}
        if (node.attributes && Array.isArray(node.attributes)) {
          for (const attr of node.attributes) {
            if (attr.value?.type === 'mdxJsxAttributeValueExpression') {
              try {
                props[attr.name] = JSON.parse(attr.value.value)
              } catch {
                props[attr.name] = attr.value.value
              }
            } else {
              props[attr.name] = attr.value === null ? true : attr.value
            }
          }
        }
        return props
      }

      const extractEvents = (node: any): TimelineEvent[] => {
        const attr = node.attributes?.find((a: any) => a.name === 'events')
        if (!attr) return []
        if (attr.value?.type === 'mdxJsxAttributeValueExpression') {
          try {
            return JSON.parse(attr.value.value)
          } catch {
            return []
          }
        }
        return []
      }

      const Wrapper = () => {
        const initialProps = extractProps(mdastNode)
        const initialEvents = extractEvents(mdastNode)

        const context = useContext(EditorContext)
        const editorRef = context?.editorRef
        const saveToWebhook = context?.saveToWebhook

        const [localProps, setLocalProps] = useState<Partial<TimelineProps>>(initialProps)
        const [localEvents, setLocalEvents] = useState<TimelineEvent[]>(initialEvents)
        const [editMode, setEditMode] = useState<boolean>(false)
        const [isHovering, setIsHovering] = useState<boolean>(false)
        const [lastsavedCHange, setLastSavedChange] = useState<string>('')

        const handleDelete = () => {
          updateMarkdown(true)
        }

        const updateMarkdown = async (deleting: boolean = false) => {
          if (!editorRef?.current) return
          const currentMarkdown = editorRef.current.getMarkdown()

          if (currentMarkdown == lastsavedCHange) return

           const { start, end } = mdastNode.position

            const before = currentMarkdown.slice(0, start.offset)
            const after = currentMarkdown.slice(end.offset)

            const propsString = Object.entries(localProps.layout??{})
              .map(([k, v]) => ` ${k}={${JSON.stringify(v)}}`)
              .join('')
            const eventsString = JSON.stringify(localEvents, null, 2)
            const newComponentMarkdown = deleting
              ? ''
              : `<Timeline ${propsString} events={${eventsString}} />`


            const updated = [...before, newComponentMarkdown, ...after].join('')


            setLastSavedChange(updated)
            editorRef.current.setMarkdown(updated)
            if (saveToWebhook) await saveToWebhook(updated)
        }

        const handleSave = () => {
          updateMarkdown()
          setEditMode(false)
        }

        const handleCancel = () => {
          setLocalProps(initialProps)
          setLocalEvents(initialEvents)
          setEditMode(false)
        }

        return (
          <div
            className="mt-6 relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Hover Buttons */}
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
                transition: 'opacity 0.2s',
              }}
            >
              <button
                onClick={() => setEditMode(true)}
                className="bg-primary text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:opacity-90 transition-opacity"
                title="Edit Timeline"
              >
                <i className="pi pi-pencil" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500/80 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:opacity-90 transition-opacity"
                title="Remove Timeline"
              >
                <i className="pi pi-trash" />
                Remove
              </button>
            </div>

            {/* Rendered Timeline */}
            <components.Timeline {...localProps} events={localEvents} />

            {/* Modal for Editing */}
            <Transition appear show={editMode} as={Fragment}>
              <Dialog as="div" className="relative z-[99999]" onClose={handleCancel}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                    >
                      <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-background border border-primary/20 p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium text-primary mb-4"
                        >
                          Edit Timeline
                        </Dialog.Title>

                        {/* Editable Form */}
                        <div className="space-y-6 text-secondary">
                          <div>
                            <h4 className="font-semibold mb-2 text-primary">Timeline Props</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <label className="flex flex-col">
                                Layout
                                <select
                                  className="border border-primary/40 p-1 rounded bg-background text-secondary"
                                  value={(localProps.layout as string) || 'vertical'}
                                  onChange={(e) =>
                                    setLocalProps({ ...localProps, layout: e.target.value as any })
                                  }
                                >
                                  <option value="vertical">vertical</option>
                                  <option value="horizontal">horizontal</option>
                                </select>
                              </label>
                              <label className="flex flex-col">
                                Align
                                <select
                                  className="border border-primary/40 p-1 rounded bg-background text-secondary"
                                  value={(localProps.align as string) || 'left'}
                                  onChange={(e) =>
                                    setLocalProps({ ...localProps, align: e.target.value as any })
                                  }
                                >
                                  <option value="left">left</option>
                                  <option value="right">right</option>
                                  <option value="alternate">alternate</option>
                                  <option value="top">top</option>
                                  <option value="bottom">bottom</option>
                                </select>
                              </label>
                              <label className="flex flex-col col-span-2">
                                Opposite
                                <input
                                  type="checkbox"
                                  checked={!!localProps.opposite}
                                  onChange={(e) =>
                                    setLocalProps({ ...localProps, opposite: e.target.checked })
                                  }
                                  className="mt-1 accent-primary"
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-primary">Eventos</h4>
                            <EventEditor events={localEvents} onChange={setLocalEvents} />
                          </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-secondary border border-primary/30 rounded hover:bg-primary/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-90 transition-opacity"
                          >
                            Save
                          </button>
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
          </div>
        )
      }

      return <Wrapper />
    },
  }
}

