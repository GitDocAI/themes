'use client'

import React from 'react'
import { Timeline as PrimeTimeline } from 'primereact/timeline'

export interface TimelineEvent {
  content: string | React.ReactNode
  title?: string
  date?: string
  icon?: string
  color?: string
  image?: string
}

export interface TimelineProps {
  events: TimelineEvent[]
  layout?: 'vertical' | 'horizontal'
  align?: 'left' | 'right' | 'alternate' | 'top' | 'bottom'
  opposite?: boolean
  children?: React.ReactNode
  [key: string]: any
}

export const BasicTimeline: React.FC<TimelineProps> = ({
  events,
  layout = 'vertical',
  align = 'left',
  opposite = false,
  children,
  ...props
}) => {
  const customizedMarker = (item: TimelineEvent) => {
    if (!item) return null

    return (
      <span
        className="custom-timeline-marker"
        style={{
          backgroundColor: item.color || 'rgb(var(--color-main))',
          color: 'white',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {item.icon ? <i className={item.icon} style={{ color: 'white' }}></i> : null}
      </span>
    )
  }

  const customizedContent = (item: TimelineEvent) => {
    if (!item) return null

    // If it's a complex event with title or image, render as a card
    if (item.title || item.image) {
      return (
        <div className="timeline-card">
          {item.image && (
            <div className="timeline-card-image">
              <img src={item.image} alt={item.title || 'Timeline event'} />
            </div>
          )}
          <div className="timeline-card-body">
            {item.title && <h4 className="timeline-card-title">{item.title}</h4>}
            {item.date && <p className="timeline-card-date">{item.date}</p>}
            <div className="timeline-card-content">
              {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
            </div>
          </div>
        </div>
      )
    }

    // Simple content
    return (
      <div className="timeline-content">
        <div className="timeline-content-text">
          {typeof item.content === 'string' ? item.content : item.content}
        </div>
      </div>
    )
  }

  const customizedOpposite = (item: TimelineEvent) => {
    if (!item) return <span>&nbsp;</span>

    // Only show date in opposite if we're not showing it in the card
    if (item.date && !item.title && !item.image) {
      return <small className="timeline-date">{item.date}</small>
    }
    return <span>&nbsp;</span>
  }

  return (
    <div className="my-6">
      <PrimeTimeline
        value={events}
        layout={layout}
        align={align}
        marker={customizedMarker}
        content={customizedContent}
        opposite={opposite ? customizedOpposite : undefined}
        {...props}
      />
    </div>
  )
}

// Alternative component for children-based timeline items
interface TimelineItemProps {
  icon?: string
  color?: string
  date?: string
  title?: string
  image?: string
  children: React.ReactNode
}

export const TimelineItem: React.FC<TimelineItemProps> = () => {
  // This is just a placeholder component that will be parsed by the parent
  return null
}
