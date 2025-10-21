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
  const header = image ? (
    <img alt={title || 'Card image'} src={image} />
  ) : icon ? (
    <div className="prime-card-icon-header">
      <i className={icon}></i>
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
      <div className="my-6">
        <a href={href} className="prime-card-link">
          {cardContent}
        </a>
      </div>
    )
  }

  return (
    <div className="my-6">
      {cardContent}
    </div>
  )
}
