'use client'

import { Anchor } from 'nextra/components'
import { NavigationItem,NavigationAgrupation, NavigationPage, ThemeInfo } from '../models/ThemeInfo'
import { usePathname } from 'next/navigation'
import { Version, Tab } from '../models/InnerConfiguration'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import {splitPageUrl} from '../shared/splitPageUrl'
export const Sidebar = ({ themeinfo, versions, tabs }: { themeinfo: ThemeInfo, versions: Version[], tabs: Tab[] }) => {
  const pathname = usePathname()
  const [items, setItems] = useState<NavigationItem[]>(themeinfo.navigation.items ?? [])
  const [isOpen, setIsOpen] = useState(false)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };

  function getRedirection(element: any): string {
    if (element.children) return getRedirection(element.children[0])
    return splitPageUrl(element.page)
  }

  useEffect(() => {
    const handleResize = () => setIsOpen(false)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (versions.length > 0) {
      const matchedVersion = versions.find(v => v.paths.includes(pathname))
      if (!matchedVersion) redirect(versions[0].paths[0])

      const matchedTab = tabs.find(t => t.paths.includes(pathname))
      const _items = themeinfo.navigation.versions!.find(v => v.version == matchedVersion?.version)!
      setItems(
        matchedVersion!.tabs.length > 0
          ? _items.tabs!.find(t => t.tab == matchedTab!.tab)!.items!
          : _items.items!
      )
    } else if (tabs.length > 0) {
      const matchedTab = tabs.find(t => t.paths.includes(pathname))
      if (!matchedTab) redirect(tabs[0].paths[0])
      const _items = themeinfo.navigation.tabs!.find(v => v.tab == matchedTab!.tab)!.items!
      setItems(_items)
    } else if (pathname === '/') {
      redirect( getRedirection(items[0]))
    }
  }, [pathname, versions, tabs])



function dropdownHasActiveChild(dropdown: NavigationItem, pathname: string): boolean {
  if (dropdown.type == 'page') return false
  dropdown = dropdown as NavigationAgrupation
  return dropdown.children.some(child => {
    if (child.type === 'page') {
      return  splitPageUrl(child.page) === pathname
    }
    if (child.type === 'dropdown') {
      return dropdownHasActiveChild(child, pathname)
    }
    if (child.type === 'group') {
      return child.children.some(grandchild => dropdownHasActiveChild(grandchild, pathname))
    }
    return false
  })
}

  function renderNestedItem(item: NavigationItem, depth: number) {
    const paddingLeft = `pl-${depth * 4 + 4}`
    switch (item.type) {
      case 'group':
        return (
          <div key={item.title} className={`mb-4 ${paddingLeft}`}>
            <div className="font-bold text-sm uppercase text-secondary mb-2 px-2 tracking-wide">
              {item.title}
            </div>
            <div className="space-y-1 pl-2">
              {item.children?.map(child => renderNestedItem(child as NavigationPage, 1))}
            </div>
          </div>
        )
      case 'dropdown':
       const isOpen = dropdownHasActiveChild(item, pathname)
        return (
          <details key={item.title} className={`group cursor-pointer ${paddingLeft}`}
 open={isOpen}
          >
            <summary className="flex items-center justify-between py-1 px-2 text-sm font-medium rounded-md text-secondary hover:bg-secondary/10 hover:text-primary">
              <span className="font-bold text-sm uppercase text-secondary mb-2 px-2 tracking-wide">{item.title}</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div className="mt-1 space-y-1 pl-4 border-l border-secondary/20 ml-2">
              {item.children?.map(child => renderNestedItem(child as NavigationPage, 1))}
            </div>
          </details>
        )
      case 'page':
        item.page = splitPageUrl(item.page)
        const isActive = item.page === pathname

        return item.title ? (
          <Anchor
            key={item.page + item.title}
            href={item.page || '#'}
            className={`block py-1 px-2 rounded-md text-sm transition-colors duration-150 ease-in-out ${paddingLeft} ${isActive
              ? 'sidebar-active font-medium text-primary'
              : 'text-secondary hover:bg-secondary/10 hover:text-primary'
              }`}
          >
            {item.title}
          </Anchor>
        ) : null

      case 'swagger':
      case 'openapi':
        item.page = splitPageUrl(item.page)
         const isActive_ = item.page === pathname;

        return item.title ? (
          <Anchor
            key={item.page + item.title}
            href={item.page || '#'}
            className={`flex items-center gap-2 py-1 px-2 rounded-md text-sm transition-colors duration-150 ease-in-out ${paddingLeft} ${isActive_
              ? 'sidebar-active font-medium text-primary'
              : 'text-secondary hover:bg-secondary/10 hover:text-primary'
              }`}
          >
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold shadow flex-shrink-0 ${methodColors[item.method]}`}
            >
              {item.method}
            </span>
            <span className="flex-grow min-w-0">
              {item.title}
            </span>
          </Anchor>
        ) : null


      default:
        return null
    }

  }

  return (
    <>
      {/* Mobile launcher button */}
      <div className="sm:hidden   py-2 border-b border-secondary/10  sticky top-0 z-20 flex items-center gap-2">

        <div
          onClick={() => setIsOpen(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>

      {/* Sidebar full */}
      <aside
        className={`
          sidebar
          fixed sm:sticky top-24 left-0 h-full max-h-[90dvh] w-72 overflow-y-auto pl-2 px-6 py-6 z-50 sm:z-10
          transition-transform duration-300 min-w-64 ease-in-out bg-background sm:bg-transparent
          border-r border-secondary/10
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
          ${!isMobile ? 'bg-transparent' : ''}
        `}
      >
        {/* Cerrar sidebar (solo móvil) */}
        <div className="sm:hidden flex justify-end mb-4">
          <button
            className="p-2 rounded-md text-secondary hover:text-primary hover:bg-secondary/10"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {items.map(item => {
            return renderNestedItem(item, 0)
          })}
        </nav>
      </aside>
    </>
  )
}




