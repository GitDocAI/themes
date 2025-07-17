'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NavigationItem, ThemeInfo } from '../models/ThemeInfo'
import { Version, Tab } from '../models/InnerConfiguration'
import { redirect } from 'next/navigation'

type Props = {
  themeinfo: ThemeInfo
  versions: Version[]
  tabs: Tab[]
}

export function PrevNextNavigation({ themeinfo, versions, tabs }: Props) {
  const pathname = usePathname()
  const [pages, setPages] = useState<NavigationItem[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  function getNavigationItems(): NavigationItem[] {
    if (versions.length > 0) {
      const matchedVersion = versions.find(v => v.paths.includes(pathname))
      if (!matchedVersion) redirect(versions[0].paths[0])

      const matchedTab = tabs.find(t => t.paths.includes(pathname))
      const versionNode = themeinfo.navigation.versions?.find(v => v.version === matchedVersion?.version)

      if (!versionNode) return []

      return matchedVersion.tabs.length > 0
        ? versionNode.tabs?.find(t => t.tab === matchedTab?.tab)?.items ?? []
        : versionNode.items ?? []
    }

    if (tabs.length > 0) {
      const matchedTab = tabs.find(t => t.paths.includes(pathname))
      if (!matchedTab) redirect(tabs[0].paths[0])

      return themeinfo.navigation.tabs?.find(t => t.tab === matchedTab?.tab)?.items ?? []
    }

    if (pathname === '/') {
      const fallback = themeinfo.navigation.items?.[0]
      if (fallback?.children?.[0]?.page) {
        redirect(fallback.children[0].page.split('.')[0])
      }
    }

    return themeinfo.navigation.items ?? []
  }

  function flattenPages(items: NavigationItem[]): NavigationItem[] {
    return items.flatMap(item => {
      if (item.type === 'page') return [item]
      if (item.children) return flattenPages(item.children as NavigationItem[])
      return []
    })
  }

  useEffect(() => {
    const items = getNavigationItems()
    const flat = flattenPages(items)
    setPages(flat)

    const index = flat.findIndex(i => i.page?.split('.')[0] === pathname)
    setCurrentIndex(index)
  }, [pathname, themeinfo, versions, tabs])

  if (currentIndex === null || pages.length === 0) return null

  const prev = pages[currentIndex - 1] as any
  const next = pages[currentIndex + 1] as any

  return (
    <div className="mt-12 pt-6  flex  flex-row items-center justify-around gap-4 text-primary text-sm">
      {prev ? (
        <Link
          href={prev.page!}
          className="group flex items-center border border-primary/20 rounded-lg px-4 py-3 w-full md:w-auto hover:bg-primary/5 transition-colors min-w-sm"

        >
          <i className="pi pi-arrow-left text-primary mr-2" />
          <div className="flex flex-col text-lg">
            <span className="text-lg text-gray-500 group-hover:text-primary/80 transition">
              Prev
            </span>
            <span
              className="!text-primary font-medium">{prev.title}</span>
          </div>
        </Link>
      ) : <div />}

      {next ? (
        <Link
          href={next.page!}
          className="group flex items-center border border-primary/20 rounded-lg px-4 py-3 w-full md:w-auto justify-end hover:bg-primary/5 transition-colors min-w-sm"
        >
          <div className="flex flex-col text-right text-lg">
            <span className=" text-gray-500 group-hover:text-primary/80 transition">
              Next
            </span>
            <span className="text-primary font-medium">{next.title}</span>
          </div>
          <i className="pi pi-arrow-right text-primary ml-2" />
        </Link>
      ) : null}
    </div>
  )
}
