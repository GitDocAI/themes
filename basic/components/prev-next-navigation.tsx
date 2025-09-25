'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NavigationItem, ThemeInfo,NavigationAgrupation,NavigationPage,NavigationGroup,NavigationDropdown,NavigationApiref } from '../models/ThemeInfo'
import { Version, Tab } from '../models/InnerConfiguration'
import { redirect } from 'next/navigation'
import {splitPageUrl} from '../shared/splitPageUrl'

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
      const fallback = themeinfo.navigation.items![0]
      if(isNavigationPage(fallback)){
        return [fallback]
      }else if(isNavigationGroup(fallback) || isNavigationDropdown(fallback)){
        return fallback.children
      }

    }

    return themeinfo.navigation.items ?? []
  }


 function isNavigationGroup(item: NavigationItem): item is NavigationGroup {
  return item.type === 'group'
}

 function isNavigationDropdown(item: NavigationItem): item is NavigationDropdown {
  return item.type === 'dropdown'
}

 function isNavigationPage(item: NavigationItem): item is NavigationPage {
  return item.type === 'page'
}

  function flattenPages(items: NavigationItem[]): (NavigationPage|NavigationApiref)[] {
    return items.flatMap(item => {
      if (item.type === 'swagger' || item.type === 'openapi'||item.type === 'page') return [item]
      item = item as NavigationAgrupation
      if (item.children) return flattenPages(item.children as NavigationItem[])
      return []
    })
  }



  useEffect(() => {
    const items = getNavigationItems()
    const flat = flattenPages(items)
    setPages(flat)

    const index = flat.findIndex(i => splitPageUrl(i.page)  === pathname)
    setCurrentIndex(index)
  }, [pathname, themeinfo, versions, tabs])

  if (currentIndex === null || pages.length === 0) return null

  const prev = pages[currentIndex - 1] as any
  const next = pages[currentIndex + 1] as any

  return (
    <div className="mt-auto pt-6  flex  flex-row items-center justify-between gap-4  text-sm md:px-6 [grid-area:nav]">
      {prev ? (
        <Link
          href={prev.page!}
          className="group flex items-center  rounded-lg sm:px-4 py-3 w-full md:w-auto hover:bg-primary/5 transition-colors lg:min-w-sm"

        >
          <i className="pi pi-arrow-left  sm:mr-2" />
          <div className="flex flex-col sm:text-lg">
            <span
              className="font-medium">{prev.title}</span>
          </div>
        </Link>
      ) : <div ></div>}

      {next ? (
        <Link
          href={next.page!}
          className="group flex items-center rounded-lg sm:px-4 py-3 w-full md:w-auto justify-end hover:bg-primary/5 transition-colors lg:min-w-sm"
        >
          <div className="flex flex-col text-right sm:text-lg">
            <span className=" font-medium">{next.title}</span>
          </div>
          <i className="pi pi-arrow-right  sm:ml-2" />
        </Link>
      ) : <div ></div>}
    </div>
  )
}
