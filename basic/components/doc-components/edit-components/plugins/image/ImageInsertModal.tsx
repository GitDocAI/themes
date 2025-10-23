'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ImageInsertModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (imageMarkdown: string) => void
  onUpload: (file: File) => Promise<string>
  initialUrl?: string
  initialAlt?: string
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  onUpload,
  initialUrl = '',
  initialAlt = '',
}) => {
  const [sourceType, setSourceType] = useState<'url' | 'local'>('url')
  const [imageUrl, setImageUrl] = useState(initialUrl)
  const [alt, setAlt] = useState(initialAlt)
  const [isUploading, setIsUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(initialUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset states when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setImageUrl(initialUrl || '')
      setAlt(initialAlt || '')
      setPreviewSrc(initialUrl || '')
      setSelectedFile(null)
      setSourceType('url')
    }
  }, [isOpen, initialUrl, initialAlt])

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
      setPreviewSrc(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload immediately when file is selected
    setIsUploading(true)
    try {
      const uploadedPath = await onUpload(file)
      // Store the uploaded path in imageUrl so we can use it later
      setImageUrl(uploadedPath)
    } catch (error) {
      console.error('Error auto-uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to upload image: ${errorMessage}`)
      // Clear the selected file on error
      setSelectedFile(null)
      setPreviewSrc('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setPreviewSrc(url)
  }

  const handleInsert = async () => {
    if (!alt.trim()) {
      alert('Please provide alt text for the image')
      return
    }

    // Validate we have an image URL (either from URL input or from auto-upload)
    if (!imageUrl.trim()) {
      if (sourceType === 'local') {
        alert('Please wait for the image to finish uploading')
      } else {
        alert('Please provide an image URL')
      }
      return
    }

    // Create image markdown as JSX format (not standard markdown)
    const imageMarkdown = `<img\n  src="${imageUrl}"\n  alt="${alt}"\n/>\n\n`

    // IMPORTANT: Call onInsert BEFORE onClose, just like CardModal does
    onInsert(imageMarkdown)
    onClose()

    // Reset state after closing
    setSourceType('url')
    setImageUrl('')
    setAlt('')
    setPreviewSrc('')
    setSelectedFile(null)
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
            Insert Image
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
          {/* Source Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Image Source
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSourceType('url')
                  setPreviewSrc(imageUrl || '')
                  setSelectedFile(null)
                  if (!imageUrl) setImageUrl('')
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: sourceType === 'url' ? '600' : '500',
                  backgroundColor: sourceType === 'url' ? '#2563eb' : 'transparent',
                  color: sourceType === 'url' ? 'white' : '#6b7280',
                  border: sourceType === 'url' ? '2px solid #2563eb' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (sourceType !== 'url') {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (sourceType !== 'url') {
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
                  setSourceType('local')
                  setImageUrl('')
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: sourceType === 'local' ? '600' : '500',
                  backgroundColor: sourceType === 'local' ? '#2563eb' : 'transparent',
                  color: sourceType === 'local' ? 'white' : '#6b7280',
                  border: sourceType === 'local' ? '2px solid #2563eb' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (sourceType !== 'local') {
                    e.currentTarget.style.borderColor = '#9ca3af'
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (sourceType !== 'local') {
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
          {sourceType === 'url' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Image URL *
              </label>
              <input
                type="url"
                value={imageUrl || ''}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          )}

          {/* File Upload */}
          {sourceType === 'local' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Select Image File *
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
                Choose Image
              </button>
              {selectedFile && (
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name}
                </span>
              )}
            </div>
          )}

          {/* Alt Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Alt Text / Caption *
            </label>
            <textarea
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none font-inherit resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This text will be displayed as a caption below the image and used as alt text for accessibility.
            </p>
          </div>

          {/* Image Preview */}
          {previewSrc && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Preview
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <img
                  src={previewSrc}
                  alt={alt || 'Preview'}
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                  onError={() => setPreviewSrc('')}
                />
              </div>
            </div>
          )}
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
            {isUploading ? 'Uploading...' : 'Insert Image'}
          </button>
        </div>
      </div>
    </div>
  )
}
