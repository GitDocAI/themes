import React from 'react'
import { IconRenderer } from './common/IconPicker'

interface LabelProps {
  label: string
  color?: string
  theme?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
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

  const textColor = theme === 'light' ? '#000000' : '#ffffff'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        borderRadius: '4px',
        fontWeight: '500',
        backgroundColor: color,
        color: textColor,
        border: `1px solid ${color}`,
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
            color: textColor,
          }}
        />
      )}
      {label}
    </span>
  )
}
