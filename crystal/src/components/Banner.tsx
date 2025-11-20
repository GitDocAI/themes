import { useState } from 'react'
import { configLoader } from '../services/configLoader'

interface BannerProps {
  theme: 'light' | 'dark'
}

export const Banner: React.FC<BannerProps> = ({ theme }) => {
  // Load banner config synchronously to prevent layout shift
  const config = configLoader.getConfig()
  const hasBanner = config?.banner?.message ? true : false
  const message = hasBanner ? config!.banner!.message : ''
  const bannerColor = hasBanner ? config!.banner!.colors[theme] : '#3b82f6'

  const [visible, setVisible] = useState(true)

  // Don't render at all if there's no banner configured
  if (!hasBanner || !visible || !message) return null

  // Convertir hex a rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return `rgba(59, 130, 246, ${alpha})`
  }

  return (
    <div
      style={{
        width: '100%',
        margin: '0',
        padding: '12px 16px',
        backgroundColor: hexToRgba(bannerColor, 0.1),
        borderBottom: `1px solid ${hexToRgba(bannerColor, 0.2)}`,
        color: bannerColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        fontSize: '14px',
        fontWeight: '500',
        boxSizing: 'border-box'
      }}
    >
      <i className="pi pi-info-circle" style={{ fontSize: '16px' }}></i>
      <span>{message}</span>
      <button
        onClick={() => setVisible(false)}
        style={{
          position: 'absolute',
          right: '16px',
          background: 'transparent',
          border: 'none',
          color: bannerColor,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 0.2s',
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7'
        }}
        aria-label="Close banner"
      >
        <i className="pi pi-times" style={{ fontSize: '14px' }}></i>
      </button>
    </div>
  )
}
