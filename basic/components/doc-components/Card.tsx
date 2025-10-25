import React from 'react'
import { Card as PrimeCard } from 'primereact/card'

interface PrimeCardProps {
  title?: string
  subtitle?: string
  image?: string
  icon?: string
  href?: string
  children: React.ReactNode
  [key: string]: any
}

export const BasicPrimeCard: React.FC<PrimeCardProps> = ({
  title,
  subtitle,
  image,
  icon,
  href,
  children,
  ...props
}) => {
  // Normalize icon className - add "pi" prefix if not present
  const iconClassName = icon
    ? (icon.startsWith('pi ') || icon.startsWith('pi-') ? icon : `pi ${icon}`)
    : undefined

  const header = image ? (
    <img alt={title || 'Card image'} src={image} />
  ) : iconClassName ? (
    <div className="prime-card-icon-header">
      <i className={iconClassName}></i>
    </div>
  ) : undefined

  const cardContent = (
    <PrimeCard
      title={title}
      subTitle={subtitle}
      header={header}
      {...props}
    >
      <div className="prime-card-content">
        {children}
      </div>
    </PrimeCard>
  )

  if (href) {
    return (
      <div className="my-6 prime-card-clickable-wrapper" onClick={() => window.location.href = href}>
        {cardContent}
      </div>
    )
  }

  return (
    <div className="my-6">
      {cardContent}
    </div>
  )
}
