import React from 'react'
import { ScrollPanel as PrimeScrollPanel } from 'primereact/scrollpanel'

interface ScrollPanelProps {
  children: React.ReactNode
  height?: string
  width?: string
  style?: React.CSSProperties
  [key: string]: any
}

export const BasicScrollPanel: React.FC<ScrollPanelProps> = ({
  children,
  height = '400px',
  width = '100%',
  style,
  ...props
}) => {
  return (
    <div className="my-6">
      <PrimeScrollPanel
        style={{
          width,
          height,
          ...style
        }}
        {...props}
      >
        <div className="scroll-panel-content">
          {children}
        </div>
      </PrimeScrollPanel>
    </div>
  )
}
