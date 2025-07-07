import type { Heading } from 'nextra'
import type { FC } from 'react'

export const TOC: FC<{ toc: Heading[] }> = ({ toc }) => {
  return (
    <div className="bg-background px-5 text-secondary">
      <h3>Table of Contents</h3>
      <ul>
        {toc.map(heading => (
          <li key={heading.id}>{heading.value}</li>
        ))}
      </ul>
    </div>
  )
}
