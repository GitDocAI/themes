import React from 'react'
import { IconRenderer } from './common/IconPicker'

interface LabelProps {
  label: string
  color?: string
  theme?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex
}

export const Label: React.FC<LabelProps> = ({
  label,
  color = '#3b82f6',
  theme = 'light',
  size = 'md',
  icon
}) => {
  const sizes = {
    sm: {
      padding: '0.125rem 0.5rem',
      fontSize: '0.625rem',
      iconSize: '0.625rem',
    },
    md: {
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      iconSize: '0.75rem',
    },
    lg: {
      padding: '0.375rem 1rem',
      fontSize: '0.875rem',
      iconSize: '0.875rem',
    },
  }

  const bgOpacity = theme === 'light' ? 0.1 : 0.15
  const backgroundColor = hexToRgba(color, bgOpacity)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: '4px',
        fontWeight: '600',
        backgroundColor: backgroundColor,
        color: color,
        padding: sizes[size].padding,
        fontSize: sizes[size].fontSize,
      }}
    >
      {icon && (
        <IconRenderer
          iconKey={icon}
          style={{
            fontSize: sizes[size].iconSize,
            width: sizes[size].iconSize,
            height: sizes[size].iconSize,
            color: color,
          }}
        />
      )}
      {label}
    </span>
  )
}
