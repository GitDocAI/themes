import type { FC, ReactNode } from 'react'
import type { FooterItem } from '../models/ThemeInfo'

export const Footer: FC<{
  items: FooterItem[]
  name: string
  logo: ReactNode
}> = ({ items, name }) => {
  return (
    <footer className=" border-t border-secondary/10 py-6 px-4 sm:px-8 [grid-area:footer]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-secondary font-semibold ">{name}</span>
        </div>

        <div className="flex items-center space-x-4">
          {items?.map((it, idx) => (
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
      <span className="flex flex-row items-center justify-center"> <small className="text-[0.6rem] text-secondary/60">© {(new Date()).getFullYear()} all rights reserved</small> </span>
    </footer>
  )
}

