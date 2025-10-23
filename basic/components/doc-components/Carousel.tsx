'use client'

import React from 'react'
import { Carousel as PrimeCarousel } from 'primereact/carousel'

interface CarouselImage {
  src: string
  alt?: string
  title?: string
  href?: string
}

interface CarouselProps {
  images?: CarouselImage[]
  numVisible?: number
  numScroll?: number
  autoplayInterval?: number
  circular?: boolean
  showIndicators?: boolean
  showNavigators?: boolean
}

export const BasicCarousel: React.FC<CarouselProps> = ({
  images,
  numVisible = 3,
  numScroll = 1,
  autoplayInterval = 0,
  circular = true,
  showIndicators = true,
  showNavigators = true
}) => {
  // Responsive options for different screen sizes
  const responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: Math.min(numVisible, 3),
      numScroll: 1
    },
    {
      breakpoint: '1199px',
      numVisible: Math.min(numVisible, 2),
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 1,
      numScroll: 1
    }
  ]

  // Template for rendering each carousel item
  const itemTemplate = (item: CarouselImage) => {
    const content = (
      <div className={`carousel-item carousel-item-card ${item.href ? 'has-link' : ''}`}>
        <div className="carousel-item-image-wrapper">
          <img src={item.src} alt={item.alt || item.title || 'Carousel image'} />
        </div>
        {item.title && (
          <div className="carousel-item-body">
            <h4 className="carousel-item-title">{item.title}</h4>
          </div>
        )}
      </div>
    )

    if (item.href) {
      return (
        <a href={item.href} className="carousel-item-link">
          {content}
        </a>
      )
    }

    return content
  }

  return (
    <div className="carousel-wrapper">
      <PrimeCarousel
        value={images}
        numVisible={numVisible}
        numScroll={numScroll}
        responsiveOptions={responsiveOptions}
        itemTemplate={itemTemplate}
        circular={circular}
        autoplayInterval={autoplayInterval}
        showIndicators={showIndicators}
        showNavigators={showNavigators}
      />
    </div>
  )
}
