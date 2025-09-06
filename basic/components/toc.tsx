import type { Heading } from 'nextra'
import type { FC } from 'react'

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  return (
    <aside className=" hidden xl:block w-64 flex-shrink-0 sticky top-18 h-full overflow-y-auto  px-6 py-6 text-secondary [grid-area:toc]">
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
    </aside>
  )
}
