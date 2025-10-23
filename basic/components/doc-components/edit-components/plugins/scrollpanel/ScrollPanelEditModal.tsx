'use client'

import React, { useState, useEffect } from 'react'

interface ScrollPanelEditModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (height: string, width: string) => void
  initialHeight?: string
  initialWidth?: string
}

export const ScrollPanelEditModal: React.FC<ScrollPanelEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  initialHeight = '400px',
  initialWidth = '100%',
}) => {
  const [height, setHeight] = useState(initialHeight)
  const [width, setWidth] = useState(initialWidth)

  // Load initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setHeight(initialHeight)
      setWidth(initialWidth)
    }
  }, [isOpen, initialHeight, initialWidth])

  if (!isOpen) return null

  const handleUpdate = () => {
    onUpdate(height, width)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-[95%] max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit ScrollPanel
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none p-0 bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Height */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Height
            </label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="400px"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Examples: 400px, 50vh, 500px
            </p>
          </div>

          {/* Width */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Width
            </label>
            <input
              type="text"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="100%"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Examples: 100%, 600px, 80%
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 text-sm bg-blue-600 text-white border-none rounded-md cursor-pointer font-medium hover:bg-blue-700 transition-colors"
          >
            Update ScrollPanel
          </button>
        </div>
      </div>
    </div>
  )
}
