'use client'

import React, { useState, useRef } from 'react'

interface FrameEditModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (newAlt: string, newCaption: string, newImagePath?: string) => void
  onUpload: (file: File) => Promise<string> // Returns new image path
  currentSrc: string
  currentAlt: string
  currentCaption: string
}

export const FrameEditModal: React.FC<FrameEditModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  onUpload,
  currentSrc,
  currentAlt,
  currentCaption,
}) => {
  const [alt, setAlt] = useState(currentAlt)
  const [caption, setCaption] = useState(currentCaption)
  const [isUploading, setIsUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(currentSrc)
  const [newFile, setNewFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setNewFile(file)
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewSrc(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdate = async () => {
    setIsUploading(true)
    try {
      let newImagePath: string | undefined

      // If there's a new file, upload it first
      if (newFile) {
        newImagePath = await onUpload(newFile)
      }

      // Update the frame with new alt, caption and optionally new path
      onUpdate(alt, caption, newImagePath)
      onClose()
    } catch (error) {
      console.error('Error updating frame:', error)
      alert('Failed to update frame. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-[90%] max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Frame
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
          {/* Image Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Image Preview
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <img
                src={previewSrc}
                alt={alt}
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            </div>
          </div>

          {/* Replace Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Replace Image (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Choose New Image
            </button>
            {newFile && (
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                Selected: {newFile.name}
              </span>
            )}
          </div>

          {/* Alt Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Alt Text *
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for accessibility..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Used for screen readers and SEO.
            </p>
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption that will be displayed below the image..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will be displayed below the image as a visible caption.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!alt || isUploading}
            className={`px-4 py-2 text-sm text-white border-none rounded-md font-medium transition-colors ${
              alt && !isUploading
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Updating...' : 'Update Frame'}
          </button>
        </div>
      </div>
    </div>
  )
}
