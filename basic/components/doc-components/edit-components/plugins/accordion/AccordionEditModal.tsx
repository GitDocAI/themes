'use client'

import React, { useState } from 'react'

interface AccordionTab {
  header: string
  content: string
}

interface AccordionEditModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (tabs: AccordionTab[], multiple: boolean) => void
  initialTabs?: AccordionTab[]
  initialMultiple?: boolean
}

export const AccordionEditModal: React.FC<AccordionEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  initialTabs,
  initialMultiple = false,
}) => {
  const [tabs, setTabs] = useState<AccordionTab[]>(
    initialTabs || [{ header: 'Tab 1', content: '' }]
  )
  const [multiple, setMultiple] = useState(initialMultiple)

  if (!isOpen) return null

  const addTab = () => {
    const newTabNumber = tabs.length + 1
    setTabs([...tabs, { header: `Tab ${newTabNumber}`, content: '' }])
  }

  const removeTab = (index: number) => {
    if (tabs.length === 1) return
    setTabs(tabs.filter((_, i) => i !== index))
  }

  const updateTabHeader = (index: number, newHeader: string) => {
    const newTabs = [...tabs]
    newTabs[index].header = newHeader
    setTabs(newTabs)
  }

  const updateTabContent = (index: number, newContent: string) => {
    const newTabs = [...tabs]
    newTabs[index].content = newContent
    setTabs(newTabs)
  }

  const handleUpdate = () => {
    onUpdate(tabs, multiple)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-auto w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Edit Accordion
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <i className="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Accordion Options */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Accordion Options
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={multiple}
                onChange={(e) => setMultiple(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                Allow multiple tabs open simultaneously
              </span>
            </label>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Accordion Tabs
              </label>
              <button
                onClick={addTab}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
              >
                <i className="pi pi-plus"></i>
                Add Tab
              </button>
            </div>
            <div className="space-y-4">
              {tabs.map((tab, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tab.header}
                      onChange={(e) => updateTabHeader(index, e.target.value)}
                      placeholder="Tab Header"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeTab(index)}
                      disabled={tabs.length === 1}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                    >
                      <i className="pi pi-trash"></i>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Tab Content (Markdown supported)
                    </label>
                    <textarea
                      value={tab.content}
                      onChange={(e) => updateTabContent(index, e.target.value)}
                      placeholder="Enter tab content in Markdown format..."
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center gap-2"
          >
            <i className="pi pi-check"></i>
            Update Accordion
          </button>
        </div>
      </div>
    </div>
  )
}
