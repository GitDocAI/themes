import type { Heading } from 'nextra'
import type { FC } from 'react'

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  return (
    <div className="w-64 flex-shrink-0 sticky top-0 h-screen overflow-y-auto bg-background px-6 py-6 text-secondary">
      <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
      <ul className="space-y-2">
        {toc.map(heading => (
          <li key={heading.id} className="text-sm">
            <a 
              href={`#${heading.id}`}
              className="text-secondary hover:text-primary transition-colors duration-150"
            >
              {heading.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
