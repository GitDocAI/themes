'use client'

import React, { useState } from 'react'
import { Dialog } from 'primereact/dialog'

interface FrameProps {
  src: string
  alt?: string
  caption?: string
  width?: string | number
  height?: string | number
}

export const Frame: React.FC<FrameProps> = ({
  src,
  alt = 'Image',
  caption,
  width = '100%',
  height = 'auto'
}) => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <div className="frame-container">
        <div className="frame-image-wrapper">
          <img
            src={src}
            alt={alt}
            style={{ width, height }}
            className="frame-image"
          />
          <button
            className="frame-zoom-button"
            onClick={() => setVisible(true)}
            aria-label="Zoom image"
          >
            <i className="pi pi-search-plus"></i>
          </button>
        </div>
        {caption && (
          <div className="frame-caption">
            {caption}
          </div>
        )}
      </div>

      <Dialog
        visible={visible}
        onHide={() => setVisible(false)}
        className="frame-dialog"
        modal
        dismissableMask
        maximizable
      >
        <img
          src={src}
          alt={alt}
          className="frame-dialog-image"
        />
      </Dialog>
    </>
  )
}
