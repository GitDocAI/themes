import React, { useEffect, useState } from 'react'
import { configLoader } from '../../services/configLoader'
import './Card.css'
import { Image } from './ui/Image'

interface CardProps {
  title?: string
  image?: string
  icon?: string
  iconAlign?: 'left' | 'center' | 'right'
  href?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  title,
  image,
  icon,
  iconAlign = 'left',
  href,
  children,
}) => {
  const [iconColor, setIconColor] = useState('#3b82f6')

  useEffect(() => {
    // Detect current theme and get primary color from config
    const detectTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const theme = isDark ? 'dark' : 'light'
      const primaryColor = configLoader.getPrimaryColor(theme)
      setIconColor(primaryColor)
    }

    detectTheme()

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', detectTheme)

    return () => mediaQuery.removeEventListener('change', detectTheme)
  }, [])

  const iconClassName = icon
    ? (icon.startsWith('pi ') || icon.startsWith('pi-') ? icon : `pi ${icon}`)
    : undefined

  const cardClasses = `modern-card ${href ? 'modern-card-clickable' : ''}`

  const handleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="modern-card-wrapper">
      <div
        className={cardClasses}
        onClick={handleClick}
        style={{
          '--hover-border-color': href ? iconColor : undefined,
        } as React.CSSProperties}
      >
        {/* Image header (if image is provided) */}
        {image && (
          <div className="modern-card-header">
            <Image
              src={image}
              alt={title || 'Card image'}
              className="modern-card-image"
            />
          </div>
        )}

        {/* Content section */}
        <div className="modern-card-body">
          {/* Icon and Title Row */}
          <div className={`modern-card-header-row icon-align-${iconAlign}`}>
            {iconClassName && (
              <i className={iconClassName} style={{ color: iconColor }}></i>
            )}
            {title && (
              <h3 className="modern-card-title">{title}</h3>
            )}
          </div>

          {/* Content */}
          {children && (
            <div className="modern-card-content">
              {children}
            </div>
          )}
        </div>

        {/* Link indicator */}
        {href && (
          <div className="modern-card-link-indicator">
            <i className="pi pi-arrow-right" style={{ color: iconColor }}></i>
          </div>
        )}
      </div>
    </div>
  )
}
