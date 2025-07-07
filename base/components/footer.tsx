import type { FC, ReactNode } from 'react'
import type { FooterItem } from '../models/ThemeInfo'

export const Footer: FC<{
  items: FooterItem[]
  name: string
  logo: ReactNode
}> = ({ items, name, logo }) => {
  return (
    <footer className="bg-background border-t border-secondary/10 py-6 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {logo}
          <span className="text-lg font-semibold text-primary">{name}</span>
        </div>

        <div className="flex items-center space-x-4">
          {items.map((it, idx) => (
            <a
              key={idx}
              href={it.reference}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary transition-colors"
              aria-label={it.type}
            >
              <i className={`pi pi-${it.type == 'x' ? 'twitter' : it.type} text-xl`} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
