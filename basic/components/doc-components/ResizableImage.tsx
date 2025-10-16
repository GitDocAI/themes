'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ResizableImageProps {
  src: string
  alt?: string
  initialWidth?: number
}

export function ResizableImage({ src, alt = '', initialWidth }: ResizableImageProps) {
  const [width, setWidth] = useState<number>(initialWidth || 600)
  const [isResizing, setIsResizing] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width

    // Prevent text selection while resizing
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - startXRef.current
      const newWidth = Math.max(100, Math.min(startWidthRef.current + deltaX, window.innerWidth - 100))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div
      ref={containerRef}
      className="relative inline-block my-4 group"
      style={{ maxWidth: '100%' }}
      contentEditable={false}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="rounded-lg border border-neutral-200 dark:border-neutral-700 block"
        style={{
          width: `${width}px`,
          height: 'auto',
          maxWidth: '100%',
          cursor: isResizing ? 'ew-resize' : 'default'
        }}
        draggable={false}
      />

      {/* Resize handle */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                   opacity-0 group-hover:opacity-100 transition-opacity
                   bg-blue-500 rounded-full p-1.5 cursor-ew-resize
                   shadow-lg border-2 border-white dark:border-gray-800
                   hover:bg-blue-600 active:bg-blue-700
                   z-10"
        onMouseDown={handleMouseDown}
        style={{
          cursor: 'ew-resize',
          touchAction: 'none'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <path
            d="M6 4L2 8L6 12M10 4L14 8L10 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Width indicator */}
      {isResizing && (
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2
                     bg-gray-900 text-white text-xs px-2 py-1 rounded
                     pointer-events-none z-20"
        >
          {Math.round(width)}px
        </div>
      )}
    </div>
  )
}
