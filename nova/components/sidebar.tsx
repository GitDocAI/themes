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
    GET: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200/50 dark:shadow-emerald-800/30",
    POST: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200/50 dark:shadow-blue-800/30",
    PUT: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-200/50 dark:shadow-amber-800/30",
    DELETE: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200/50 dark:shadow-red-800/30",
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
          <div key={item.title} className={`mb-6`}>
            <div className="sidebar-text font-semibold text-xs uppercase mb-3 tracking-wider text-nova-500 dark:text-nova-400">
              {item.title}
            </div>
            <div className="space-y-1 pl-1">
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
            <summary className="sidebar-text flex items-center justify-between py-2 px-3 text-sm font-medium rounded-lg hover:bg-gradient-to-r hover:from-accent-primary/5 hover:to-accent-secondary/5 hover:text-accent-primary transition-all duration-200">
              <span className="sidebar-text font-medium text-sm">{item.title}</span>
              <svg className="w-4 h-4 transition-transform duration-200 group-open:rotate-90 text-nova-500 dark:text-nova-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div className="mt-1 space-y-1 pl-3 border-l border-nova-200 dark:border-nova-700 ml-3">
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
            className={`${isActive ? '' : 'sidebar-text'} text-primary block py-2 px-3 rounded-lg text-sm transition-all duration-200 ease-in-out ${paddingLeft} ${isActive
              ? 'font-medium'
              : 'hover:bg-gradient-to-r hover:from-nova-100/50 hover:to-nova-200/30 dark:hover:from-nova-800/50 dark:hover:to-nova-700/30 dark:hover:text-nova-100 hover:transform hover:translate-x-1'
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
            className={`${isActive_ ? '' : 'sidebar-text'} text-primary flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-all duration-200 ease-in-out ${paddingLeft} ${isActive_
              ? 'font-medium'
              : 'hover:bg-gradient-to-r hover:from-nova-100/50 hover:to-nova-200/30 dark:hover:from-nova-800/50 dark:hover:to-nova-700/30 dark:hover:text-nova-100 hover:transform hover:translate-x-1'
              }`}
          >
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-bold shadow-md flex-shrink-0 ${methodColors[item.method]}`}
            >
              {item.method}
            </span>
            <span className="flex-grow min-w-0 font-medium">
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
      <div className="sm:hidden py-2 border-b border-nova-200/20 dark:border-nova-700/20 sticky top-0 z-20 flex items-center gap-2">

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
          fixed sm:sticky top-0 left-0 h-full w-72 py-6 z-50 sm:z-10 overflow-y-auto
          transition-all duration-300 min-w-64 ease-in-out sm:bg-transparent
          backdrop-blur-sm border-r border-nova-200 dark:border-nova-700
          ${isOpen ? 'translate-x-0 glass-card ml-4 rounded-xl shadow-nova' : '-translate-x-full'} sm:translate-x-0 sm:glass-none sm:shadow-none sm:ml-0 sm:rounded-none
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

        <nav className="space-y-1 pl-4">
          {items.map(item => {
            return renderNestedItem(item, 0)
          })}
        </nav>
      </aside>
    </>
  )
}




