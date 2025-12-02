import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import { ContentService } from '../../../services/contentService'

export const ImageNodeView = ({ node, editor, getPos }: NodeViewProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showImageExpanded, setShowImageExpanded] = useState<boolean>(false)
  const [imageError, setImageError] = useState<boolean>(false)

  const isEditable = editor.isEditable
  const src = node.attrs.src
  const alt = node.attrs.alt
  const caption = node.attrs.caption
  const type = node.attrs.type

  // Get allowUpload option from the extension
  const allowUpload = editor.extensionManager.extensions.find((ext: any) => ext.name === 'imageBlock')?.options?.allowUpload || false

  // Detect theme
  useEffect(() => {
    const detectTheme = () => {
      const bgColor = window.getComputedStyle(document.body).backgroundColor
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      let currentTheme: 'light' | 'dark' = 'dark'

      if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        currentTheme = luminance < 0.5 ? 'dark' : 'light'
      }

      setTheme(currentTheme)
    }

    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    return () => observer.disconnect()
  }, [])

  const handleDelete = () => {
    if (getPos) {
      const pos = getPos()
      if (typeof pos === 'number') {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize })
      }
    }
  }

  const handleImageClick = () => {
    if (!isEditable && src && !imageError) {
      setShowImageExpanded(true)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <NodeViewWrapper
      className="image-node-view-wrapper"
      data-type="image-block"
      style={{ outline: 'none' }}
    >
      <div
        style={{
          margin: '1.5rem 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Image Frame */}
        <div
          style={{
            border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            borderRadius: '12px',
            padding: '10px',
            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
            backgroundImage: theme === 'light'
              ? 'linear-gradient(rgba(229, 231, 235, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.15) 1px, transparent 1px)'
              : 'linear-gradient(rgba(55, 65, 81, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(55, 65, 81, 0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            maxWidth: '100%',
            display: 'inline-block',
          }}
        >
          {/* Image */}
          {imageError ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#111827',
                borderRadius: '8px',
                padding: '2rem',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              <div>
                <i className="pi pi-image" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '1rem' }}></i>
                <div>{alt}</div>
              </div>
            </div>
          ) : (
            <img
              src={src || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
              alt={alt}
              onError={handleImageError}
              onClick={handleImageClick}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
                cursor: !isEditable && src && !imageError ? 'pointer' : 'default',
              }}
            />
          )}

          {/* Caption */}
          {caption && (
            <div
              style={{
                padding: '0.75rem 1rem',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                textAlign: 'center',
                fontStyle: 'italic',
              }}
            >
              {caption}
            </div>
          )}
        </div>

        {/* Edit Button - Only in edit mode */}
        {isEditable && (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              <i className="pi pi-pencil" style={{ fontSize: '10px', marginRight: '4px' }}></i>
              Edit Image
            </button>

            <button
              onClick={handleDelete}
              style={{
                padding: '4px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              <i className="pi pi-trash" style={{ fontSize: '10px', marginRight: '4px' }}></i>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <ImageModal
          theme={theme}
          src={src}
          alt={alt}
          caption={caption}
          type={type}
          allowUpload={allowUpload}
          onSave={(newSrc, newAlt, newCaption, newType) => {
            if (getPos && editor) {
              const pos = getPos()
              if (typeof pos === 'number') {
                editor.commands.command(({ tr }) => {
                  tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    src: newSrc,
                    alt: newAlt,
                    caption: newCaption,
                    type: newType,
                  })
                  return true
                })
              }
            }
            setShowModal(false)
          }}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Expanded Image Modal */}
      {showImageExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '2rem',
          }}
          onClick={() => setShowImageExpanded(false)}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setShowImageExpanded(false)}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>
      )}
    </NodeViewWrapper>
  )
}

// Image Modal Component
interface ImageModalProps {
  theme: 'light' | 'dark'
  src: string
  alt: string
  caption: string
  type: 'url' | 'local'
  allowUpload?: boolean
  onSave: (src: string, alt: string, caption: string, type: 'url' | 'local') => void
  onCancel: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ theme, src, alt, caption, type, allowUpload = false, onSave, onCancel }) => {
  const [imageType, setImageType] = useState<'url' | 'local'>(type)
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [imageAlt, setImageAlt] = useState<string>(alt)
  const [imageCaption, setImageCaption] = useState<string>(caption)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (_event) => {
        // Upload to backend
        try {
          const data = await ContentService.uploadFile(file)

          // Set the image source to the uploaded file path
          setImageSrc(`/${data.file_path}`)
          setImageType('local')
          setUploading(false)
        } catch (err) {
          console.error('Upload error:', err)
          setError('Failed to upload file. Please try again.')
          setUploading(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read file')
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (err) {
      console.error('File read error:', err)
      setError('Failed to process file')
      setUploading(false)
    }
  }

  const handleSave = () => {
    if (!imageSrc.trim()) {
      setError('Image source is required')
      return
    }
    if (!imageAlt.trim()) {
      setError('Alt text is required')
      return
    }
    onSave(imageSrc.trim(), imageAlt.trim(), imageCaption.trim(), imageType)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '500px',
          maxWidth: '600px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: theme === 'light' ? '#1f2937' : '#f9fafb',
          }}
        >
          Image Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Image Type Selection - Hidden in production */}
          {allowUpload && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                }}
              >
                Image Source Type
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setImageType('url')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: imageType === 'url' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                    color: imageType === 'url' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="pi pi-link" style={{ marginRight: '6px' }}></i>
                  URL
                </button>
                <button
                  onClick={() => setImageType('local')}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: imageType === 'local' ? '#3b82f6' : theme === 'light' ? '#f3f4f6' : '#374151',
                    color: imageType === 'local' ? 'white' : theme === 'light' ? '#374151' : '#d1d5db',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="pi pi-upload" style={{ marginRight: '6px' }}></i>
                  Local File
                </button>
              </div>
            </div>
          )}

          {/* Image Source */}
          {(!allowUpload || imageType === 'url') ? (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af',
                }}
              >
                Image URL
              </label>
              <input
                type="text"
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          ) : (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: theme === 'light' ? '#6b7280' : '#9ca3af',
                }}
              >
                Upload Image
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
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                  color: theme === 'light' ? '#374151' : '#d1d5db',
                  border: `2px dashed ${theme === 'light' ? '#e5e7eb' : '#4b5563'}`,
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {uploading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" style={{ marginRight: '8px' }}></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload" style={{ marginRight: '8px' }}></i>
                    Choose File
                  </>
                )}
              </button>
              {imageSrc && imageType === 'local' && (
                <p
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#10b981' : '#34d399',
                  }}
                >
                  <i className="pi pi-check-circle" style={{ marginRight: '4px' }}></i>
                  File uploaded: {imageSrc}
                </p>
              )}
            </div>
          )}

          {/* Alt Text */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Alt Text (Required)
            </label>
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder="Describe the image"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Caption */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '14px',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
              }}
            >
              Caption (Optional)
            </label>
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Image caption"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: theme === 'light' ? '#ffffff' : '#111827',
                color: theme === 'light' ? '#374151' : '#d1d5db',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p style={{ margin: '0', fontSize: '12px', color: '#ef4444' }}>
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSave}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Save
            </button>

            <button
              onClick={onCancel}
              disabled={uploading}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                color: theme === 'light' ? '#374151' : '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
