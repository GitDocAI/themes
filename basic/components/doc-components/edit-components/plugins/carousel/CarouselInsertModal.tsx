'use client'

import React, { useState, useRef, useEffect } from 'react'

interface CarouselImage {
  id: string
  src: string
  alt: string
  title?: string
  href?: string
  sourceType: 'url' | 'local'
  file?: File
}

interface CarouselInsertModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (images: CarouselImage[], numVisible: number, circular: boolean) => void
  onUpload: (file: File) => Promise<string>
}

export const CarouselInsertModal: React.FC<CarouselInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  onUpload,
}) => {
  const [images, setImages] = useState<CarouselImage[]>([])
  const [currentSourceType, setCurrentSourceType] = useState<'url' | 'local'>('url')
  const [currentUrl, setCurrentUrl] = useState('')
  const [currentAlt, setCurrentAlt] = useState('')
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentHref, setCurrentHref] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [numVisible, setNumVisible] = useState(3)
  const [circular, setCircular] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setImages([])
      setCurrentSourceType('url')
      setCurrentUrl('')
      setCurrentAlt('')
      setCurrentTitle('')
      setCurrentHref('')
      setSelectedFile(null)
      setPreviewSrc('')
      setNumVisible(3)
      setCircular(true)
    }
  }, [isOpen])

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
      // Store the uploaded path in currentUrl so we can use it later
      setCurrentUrl(uploadedPath)
    } catch (error) {
      console.error('Error auto-uploading carousel image:', error)
      alert('Failed to upload image. Please try again.')
      // Clear the selected file on error
      setSelectedFile(null)
      setPreviewSrc('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setCurrentUrl(url)
    setPreviewSrc(url)
  }

  const handleAddImage = () => {
    if (!currentAlt.trim()) {
      alert('Please provide alt text for the image')
      return
    }

    // Validate we have an image URL (either from URL input or from auto-upload)
    if (!currentUrl.trim()) {
      if (currentSourceType === 'local') {
        alert('Please wait for the image to finish uploading')
      } else {
        alert('Please provide an image URL')
      }
      return
    }

    const newImage: CarouselImage = {
      id: Date.now().toString(),
      src: currentUrl,
      alt: currentAlt,
      title: currentTitle,
      href: currentHref,
      sourceType: currentSourceType,
    }

    setImages([...images, newImage])

    // Reset current image form
    setCurrentUrl('')
    setCurrentAlt('')
    setCurrentTitle('')
    setCurrentHref('')
    setSelectedFile(null)
    setPreviewSrc('')
    setCurrentSourceType('url')
  }

  const handleRemoveImage = (id: string) => {
    setImages(images.filter(img => img.id !== id))
  }

  const handleInsert = () => {
    if (images.length === 0) {
      alert('Please add at least one image to the carousel')
      return
    }

    onInsert(images, numVisible, circular)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-[95%] max-h-[90vh] overflow-hidden shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Insert Carousel
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
          {/* Carousel Settings */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Carousel Settings</h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Images Visible
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={numVisible}
                  onChange={(e) => setNumVisible(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={circular}
                    onChange={(e) => setCircular(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Circular
                </label>
              </div>
            </div>
          </div>

          {/* Add Image Section */}
          <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
            <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Add Image</h4>

            {/* Source Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Image Source
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSourceType('url')
                    setPreviewSrc(currentUrl || '')
                    setSelectedFile(null)
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentSourceType === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSourceType('local')
                    setCurrentUrl('')
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentSourceType === 'local'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* URL Input */}
            {currentSourceType === 'url' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={currentUrl}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* File Upload */}
            {currentSourceType === 'local' && (
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
                  disabled={isUploading}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none rounded-md cursor-pointer font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Choose Image'}
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
                Alt Text *
              </label>
              <input
                type="text"
                value={currentAlt}
                onChange={(e) => setCurrentAlt(e.target.value)}
                placeholder="Describe the image..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Title (optional)
              </label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Image title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Link */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Link (optional)
              </label>
              <input
                type="url"
                value={currentHref}
                onChange={(e) => setCurrentHref(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Preview */}
            {previewSrc && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Preview
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <img
                    src={previewSrc}
                    alt={currentAlt || 'Preview'}
                    className="max-w-full max-h-40 mx-auto rounded-lg"
                    onError={() => setPreviewSrc('')}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleAddImage}
              disabled={!currentAlt || isUploading || !currentUrl}
              className={`w-full px-4 py-2 text-sm text-white border-none rounded-md font-medium transition-colors ${
                currentAlt && !isUploading && currentUrl
                  ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Add to Carousel'}
            </button>
          </div>

          {/* Images List */}
          {images.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Carousel Images ({images.length})
              </h4>
              <div className="space-y-2">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </span>
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {img.alt}
                      </p>
                      {img.title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Title: {img.title}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-none bg-transparent cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={handleInsert}
            disabled={images.length === 0}
            className={`px-4 py-2 text-sm text-white border-none rounded-md font-medium transition-colors ${
              images.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            Insert Carousel
          </button>
        </div>
      </div>
    </div>
  )
}
