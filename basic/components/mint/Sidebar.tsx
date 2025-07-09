'use client'

import { usePathname } from 'next/navigation'
import type { PageMapItem } from 'nextra'
import { Anchor } from 'nextra/components'
import { normalizePages } from 'nextra/normalize-pages'
import type { FC } from 'react'
import clsx from 'clsx'

export const Sidebar: FC<{ pageMap: PageMapItem[] }> = ({ pageMap }) => {
  const pathname = usePathname()
  const { docsDirectories } = normalizePages({
    list: pageMap,
    route: pathname
  })

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 p-5 rounded-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Sidebar</h3>
      <ul className="space-y-4">
        {docsDirectories.map(function renderItem(item) {
          const route =
            item.route || ('href' in item ? (item.href as string) : '')
          const { title } = item

          return (
            <li
              key={route}
              className="border border-gray-300 dark:border-neutral-700 rounded-md px-3 py-2"
            >
              {'children' in item ? (
                <details className="text-gray-700 dark:text-gray-200">
                  <summary className="cursor-pointer font-medium">
                    {title}
                  </summary>
                  <ul className="pl-4 mt-2 space-y-2">
                    {item.children.map(child => renderItem(child))}
                  </ul>
                </details>
              ) : (
                <Anchor
                  href={route}
                  className={clsx(
                    'block text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                  )}
                >
                  {title}
                </Anchor>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
