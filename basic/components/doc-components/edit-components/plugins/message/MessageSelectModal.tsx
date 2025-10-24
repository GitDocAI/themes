'use client'

import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

type MessageType = 'tip' | 'note' | 'warning' | 'danger' | 'info'

interface MessageSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: MessageType) => void
}

const messageTypes: { type: MessageType; label: string; icon: string; bgColor: string; borderColor: string; textColor: string }[] = [
  {
    type: 'tip',
    label: 'Tip',
    icon: 'pi-lightbulb',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500',
    textColor: 'text-green-700 dark:text-green-300'
  },
  {
    type: 'info',
    label: 'Info',
    icon: 'pi-info-circle',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  {
    type: 'note',
    label: 'Note',
    icon: 'pi-pencil',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-700 dark:text-gray-300'
  },
  {
    type: 'warning',
    label: 'Warning',
    icon: 'pi-exclamation-triangle',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  {
    type: 'danger',
    label: 'Danger',
    icon: 'pi-times-circle',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-500',
    textColor: 'text-red-700 dark:text-red-300'
  }
]

export const MessageSelectModal: React.FC<MessageSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedType, setSelectedType] = useState<MessageType>('info')

  const handleSelect = () => {
    onSelect(selectedType)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-background border border-secondary/20 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-primary mb-4">
                  Select Message Type
                </Dialog.Title>

                <div className="space-y-2 mb-6">
                  {messageTypes.map((msgType) => (
                    <button
                      key={msgType.type}
                      onClick={() => setSelectedType(msgType.type)}
                      className={`w-full text-left transition-all ${
                        selectedType === msgType.type
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'hover:ring-1 hover:ring-secondary/30'
                      }`}
                    >
                      <div
                        className={`${msgType.bgColor} ${msgType.borderColor} ${msgType.textColor} border-l-4 p-3 rounded flex items-center gap-3`}
                      >
                        <i className={`pi ${msgType.icon} text-xl`}></i>
                        <div>
                          <div className="font-semibold">{msgType.label}</div>
                          <div className="text-xs opacity-75">Sample message text</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-secondary border border-secondary/30 rounded hover:bg-secondary/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelect}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-90 transition-opacity"
                  >
                    Insert
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
