'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { getPrimaryColorStyle } from '../../hooks/useThemeColors'

interface CardProps {
  title: string
  children?: ReactNode
  icon?: string | ReactNode
  href?: string
  img?: string
  text?: string
}

export const Card = ({ title, children, icon, href, img, text }: CardProps) => {
  const { resolvedTheme } = useTheme()
  const primaryColor = getPrimaryColorStyle(resolvedTheme)

  const isExternalLink = href?.startsWith('http')
  const showArrow = isExternalLink || text
  // If there's href but no text, make the whole card clickeable
  const isWholeCardClickable = href && !text

  const LinkComponent = ({
    children: linkChildren,
    className,
    style,
    onMouseEnter,
    onMouseLeave
  }: {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
  }) => {
    if (!href) return <>{linkChildren}</>

    if (isExternalLink) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          style={style}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {linkChildren}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className={className}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {linkChildren}
      </Link>
    )
  }

  const CardContent = () => (
    <>
      {/* Image at top if provided */}
      {img && (
        <div className="w-full h-32 overflow-hidden rounded-md mb-3 -ml-4">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-col flex-1">
        {/* Icon above title */}
        {icon && (
          <div className="flex-shrink-0 mb-2" style={{ color: primaryColor }}>
            {typeof icon === 'string' ? (
              // If icon is a string, check if it's a primeicons class or URL
              icon.startsWith('pi-') || icon.startsWith('pi ') ? (
                <i className={`${icon.includes('pi-') ? icon : `pi ${icon}`} text-2xl`} />
              ) : icon.startsWith('http') || icon.startsWith('/') ? (
                <img src={icon} alt="" className="w-6 h-6" />
              ) : (
                <i className={`pi pi-${icon} text-2xl`} />
              )
            ) : (
              // If icon is a ReactNode (SVG), render it directly
              <div className="w-6 h-6">{icon}</div>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-left mb-2">
          {title}
        </h3>

        {/* Content */}
        {children && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-1 text-left">
            {children}
          </div>
        )}

        {/* CTA Link - Only shown if there's text */}
        {text && (
          <div className="text-left">
            <LinkComponent className="inline-flex items-center gap-1.5 text-sm font-medium no-underline" style={{ color: primaryColor }}>
              {text}
              {showArrow && (
                <svg
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              )}
            </LinkComponent>
          </div>
        )}
      </div>
    </>
  )

  // If whole card is clickeable, wrap everything in LinkComponent
  if (isWholeCardClickable) {
    return (
      <LinkComponent
        className="group relative flex flex-col h-full rounded-lg border-l-[3px] p-4 border border-gray-300 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 no-underline hover:border-current"
        style={{
          borderLeftColor: primaryColor,
          '--hover-border-color': primaryColor,
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = primaryColor
          e.currentTarget.style.borderLeftColor = primaryColor
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = ''
          e.currentTarget.style.borderLeftColor = primaryColor
        }}
      >
        <CardContent />
      </LinkComponent>
    )
  }

  // Otherwise, just the card container
  return (
    <div
      className="group relative flex flex-col h-full rounded-lg border-l-[3px] p-4 border border-gray-300 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftColor: primaryColor }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = primaryColor
        e.currentTarget.style.borderLeftColor = primaryColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.borderLeftColor = primaryColor
      }}
    >
      <CardContent />
    </div>
  )
}

export default Card
