import { useState } from 'react'
import type { AISearchConfig } from '../../services/configLoader'

interface AISearchButtonProps {
  config: AISearchConfig
  theme: 'light' | 'dark'
  primaryColor: string
  onClick?: () => void
}

const DEFAULT_LABEL = 'Ask to AI'

export const AISearchButton: React.FC<AISearchButtonProps> = ({
  config,
  theme: _theme,
  primaryColor,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const label = config.triggerLabel || DEFAULT_LABEL

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(139, 92, 246, ${alpha})`
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: isHovered
          ? hexToRgba(primaryColor, 0.15)
          : hexToRgba(primaryColor, 0.1),
        border: `1px solid ${hexToRgba(primaryColor, 0.3)}`,
        borderRadius: '10px',
        cursor: 'pointer',
        color: primaryColor,
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 4px 12px ${hexToRgba(primaryColor, 0.2)}`
          : 'none',
      }}
    >
      <i
        className="pi pi-sparkles"
        style={{
          fontSize: '14px',
          color: primaryColor,
        }}
      />
      <span>{label}</span>
    </button>
  )
}

export default AISearchButton
