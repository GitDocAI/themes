
import React from 'react'
import type { TimelineEvent } from '@/components/doc-components/Timeline'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'


interface EventEditorProps {
  events: TimelineEvent[]
  onChange: (events: TimelineEvent[]) => void
}

const primeIcons = [
    'pi pi-check', 'pi pi-times', 'pi pi-plus', 'pi pi-minus', 'pi pi-search', 'pi pi-pencil',
    'pi pi-trash', 'pi pi-user', 'pi pi-cog', 'pi pi-calendar', 'pi pi-clock', 'pi pi-envelope',
    'pi pi-heart', 'pi pi-star', 'pi pi-tag', 'pi pi-comment', 'pi pi-upload', 'pi pi-download',
    'pi pi-info-circle', 'pi pi-exclamation-triangle', 'pi pi-arrow-right', 'pi pi-arrow-left',
    'pi pi-arrow-up', 'pi pi-arrow-down', 'pi pi-globe', 'pi pi-home', 'pi pi-image',
    'pi pi-lock', 'pi pi-unlock', 'pi pi-map', 'pi pi-bell', 'pi pi-video', 'pi pi-power-off',
    'pi pi-shopping-cart', 'pi pi-thumbs-up', 'pi pi-thumbs-down', 'pi pi-wifi', 'pi pi-github',
    'pi pi-discord', 'pi pi-youtube', 'pi pi-twitter', 'pi pi-linkedin', 'pi pi-whatsapp',
  ]

export const EventEditor: React.FC<EventEditorProps> = ({ events, onChange }) => {
  const addEvent = () => {
    const newEvent: TimelineEvent = { content: '', title: '', date: '', icon: '', color: '' }
    onChange([...events, newEvent])
  }

  const updateEvent = (index: number, field: keyof TimelineEvent, value: any) => {
    const newEvents = events.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    onChange(newEvents)
  }

  const removeEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index)
    onChange(newEvents)
  }

  return (
    <div className="space-y-4">
      {events.map((ev, idx) => (
        <div key={idx} className="p-2 border border-secondary rounded-lg bg-background">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Event {idx + 1}</span>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => removeEvent(idx)}
            >
              <i className="pi pi-trash"></i>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              Title
              <input
                className="border border-secondary p-1 rounded"
                type="text"
                value={ev.title || ''}
                onChange={(e) => updateEvent(idx, 'title', e.target.value)}
              />
            </label>
            <label className="flex flex-col">
              Date
              <input
                className="border border-secondary p-1 rounded"
                type="text"
                value={ev.date || ''}
                onChange={(e) => updateEvent(idx, 'date', e.target.value)}
              />
            </label>
             <label className="flex flex-col gap-1">
                  <span>Icon</span>

                  <Listbox value={ev.icon || ''} onChange={(icon) => updateEvent(idx, 'icon', icon)}>
                    <div className="relative">
                      {/* Botón principal */}
                      <Listbox.Button className="relative border  w-full cursor-pointer rounded-md  bg-background py-0.5 pl-3 pr-10 text-left shadow-sm focus:outline-none">
                        {ev.icon ? (
                          <i className={`${ev.icon} text-sm`}></i>
                        ) : (
                          <span className="text-gray-400">Selecciona un ícono</span>
                        )}
                      </Listbox.Button>

                      {/* Opciones del dropdown */}
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute sidebar z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none grid grid-cols-5 gap-2 p-2">
                          {primeIcons.map((icon, i) => (
                            <Listbox.Option
                              key={i}
                              value={icon}
                              className={({ active, selected }) =>
                                `flex justify-center items-center p-2 rounded-md cursor-pointer transition-all
                                 ${active ? 'bg-secondary' : ''}
                                 ${selected ? 'bg-primary' : ''}`
                              }
                            >
                              <i className={`${icon} text-lg `}></i>
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </label>
          <label className="flex flex-col">
              Color
              <input
                className="border-1 border-secondary p-1 py-auto h-full rounded"
                type="color"
                value={ev.color || '#000000'}
                onChange={(e) => updateEvent(idx, 'color', e.target.value)}
              />
            </label>
          </div>
          <label className="flex flex-col mt-2">
            Content
            <textarea
              className="border border-secondary p-1 rounded w-full"
              rows={2}
              value={ev.content as string}
              onChange={(e) => updateEvent(idx, 'content', e.target.value)}
            />
          </label>
        </div>
      ))}
      <button
        className="mt-2 px-3 py-1 primary text-secondary rounded hover:bg-primary/90 flex items-center gap-1"
        onClick={addEvent}
      >
        <i className="pi pi-plus"></i> Add Event
      </button>
    </div>
  )
}
