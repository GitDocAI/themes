'use client'
import { usePathname } from 'next/navigation'
import type { PageMapItem } from 'nextra'
import { Anchor } from 'nextra/components'
import { normalizePages } from 'nextra/normalize-pages'
import type { FC } from 'react'

export const Navbar: FC<{ pageMap: PageMapItem[], logo: any }> = ({ pageMap, logo }) => {
  const pathname = usePathname()
  const { topLevelNavbarItems } = normalizePages({
    list: pageMap,
    route: pathname
  })

  return (
    <ul
      style={{
        display: 'flex',
        listStyleType: 'none',
        padding: 20,
        gap: 20,
        background: 'lightcoral',
        margin: 0
      }}
    >
      {logo}
      Hola Mundo
      {topLevelNavbarItems.map((item, index) => {
        const route = item.route || ('href' in item ? item.href! : '')
        return (
          <li key={`${route}-${index}`}>
            <Anchor href={route} style={{ textDecoration: 'none' }}>
              {item.title}
            </Anchor>
          </li>
        )
      })}
    </ul>
  )
}
