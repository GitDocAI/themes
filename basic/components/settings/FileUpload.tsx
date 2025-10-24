'use client'
import React, { useRef, useState } from 'react'
import { Button } from 'primereact/button'

interface FileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  maxSize?: number
  className?: string
  buttonLabel?: string
  currentValue?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  buttonLabel = 'Upload File',
  currentValue
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentValue || null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-asset', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      onUpload(result.url)

    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPreview(currentValue || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`file-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
          size="small"
          className="px-3 py-1 text-sm"
          style={{
            backgroundColor: 'rgb(var(--color-main))',
            borderColor: 'rgb(var(--color-main))',
            color: 'white',
            fontSize: '12px',
            padding: '4px 12px'
          }}
        >
          {isUploading ? (
            <>
              <i className="pi pi-spin pi-spinner mr-2"></i>
              Uploading...
            </>
          ) : (
            <>
              <i className="pi pi-upload mr-2"></i>
              {buttonLabel}
            </>
          )}
        </Button>

        {preview && (
          <div className="preview-container">
            <img
              src={preview}
              alt="Preview"
              className="w-8 h-8 rounded border object-cover"
              style={{
                border: '1px solid rgb(var(--color-muted))'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}