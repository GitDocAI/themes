'use client'

import React, { useState, useRef, useEffect } from 'react'

interface FrameInsertModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (alt: string, caption: string, imagePath: string) => void
  onUpload: (file: File) => Promise<string>
  initialUrl?: string
  initialAlt?: string
  initialCaption?: string
}

export const FrameInsertModal: React.FC<FrameInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  onUpload,
  initialUrl = '',
  initialAlt = '',
  initialCaption = '',
}) => {
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url')
  const [imageUrl, setImageUrl] = useState(initialUrl || '')
  const [alt, setAlt] = useState(initialAlt || '')
  const [caption, setCaption] = useState(initialCaption || '')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset states when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setImageUrl(initialUrl || '')
      setAlt(initialAlt || '')
      setCaption(initialCaption || '')
      setPreviewUrl(initialUrl || '')
      setSelectedFile(null)
      setImageSource('url')
    }
  }, [isOpen, initialUrl, initialAlt, initialCaption])

  if (!isOpen) return null

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately when file is selected
    setIsUploading(true)
    try {
      const uploadedPath = await onUpload(file)
      // Store the uploaded path in imageUrl so we can use it later
      setImageUrl(uploadedPath)
    } catch (error) {
      console.error('Error auto-uploading frame image:', error)
      alert('Failed to upload image. Please try again.')
      // Clear the selected file on error
      setSelectedFile(null)
      setPreviewUrl('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInsert = async () => {
    if (!alt.trim()) {
      alert('Please enter alt text for accessibility')
      return
    }

    // Validate we have an image URL (either from URL input or from auto-upload)
    if (!imageUrl.trim()) {
      if (imageSource === 'upload') {
        alert('Please wait for the image to finish uploading')
      } else {
        alert('Please enter an image URL')
      }
      return
    }

    // IMPORTANT: Call onInsert BEFORE onClose, just like CardModal does
    onInsert(alt, caption, imageUrl)
    onClose()

    // Reset state after closing
    setImageUrl('')
    setAlt('')
    setCaption('')
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const currentPreview = imageSource === 'upload' ? previewUrl : imageUrl

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
            Insert Frame
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
          {/* Image Source Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Image Source
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setImageSource('url')
                  setImageUrl(imageUrl || '')
                  setSelectedFile(null)
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: imageSource === 'url' ? '600' : '500',
                  backgroundColor: imageSource === 'url' ? '#2563eb' : 'transparent',
                  color: imageSource === 'url' ? 'white' : '#6b7280',
                  border: imageSource === 'url' ? '2px solid #2563eb' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (imageSource !== 'url') {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (imageSource !== 'url') {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageSource('upload')
                  setPreviewUrl('')
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: imageSource === 'upload' ? '600' : '500',
                  backgroundColor: imageSource === 'upload' ? '#2563eb' : 'transparent',
                  color: imageSource === 'upload' ? 'white' : '#6b7280',
                  border: imageSource === 'upload' ? '2px solid #2563eb' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (imageSource !== 'upload') {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (imageSource !== 'upload') {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                Upload File
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div className="mb-4" style={{ display: imageSource === 'url' ? 'block' : 'none' }}>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Image URL *
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png or ./assets/image.png"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          {/* File Upload */}
          <div className="mb-4" style={{ display: imageSource === 'upload' ? 'block' : 'none' }}>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Upload Image *
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
              Choose File
            </button>
            {selectedFile && (
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name}
              </span>
            )}
          </div>

          {/* Preview */}
          {currentPreview && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Preview
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <img
                  src={currentPreview}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Alt Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Alt Text *
            </label>
            <input
              type="text"
              value={alt || ''}
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
              value={caption || ''}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption that will be displayed below the frame..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will be displayed below the image.
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
            onClick={handleInsert}
            disabled={!alt || isUploading || !imageUrl}
            className={`px-4 py-2 text-sm text-white border-none rounded-md font-medium transition-colors ${
              alt && !isUploading && imageUrl
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Insert Frame'}
          </button>
        </div>
      </div>
    </div>
  )
}
