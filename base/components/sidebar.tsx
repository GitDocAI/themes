'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { PageMapItem } from 'nextra'
import { Anchor } from 'nextra/components'
import { useEffect, useMemo, useState } from 'react'

type Tab = { key: string; title: string; route?: string }
type GroupType = 'group' | 'dropdown' | 'page'
type GroupItem = PageMapItem & { type: GroupType }

export const Sidebar = ({ pageMap }: { pageMap: PageMapItem[] }) => {
  const pathname = usePathname()
  const router = useRouter()

  const basePath = '/' + pathname.split('/')[1]

  const [current, setCurrent] = useState<PageMapItem | undefined>(() =>
    pageMap.find(m => m.route === basePath)
  )

  useEffect(() => {
    const matched = pageMap.find(m => m.route === basePath)
    setCurrent(matched)
  }, [pathname, pageMap, basePath]) // Añadido basePath a dependencias para mayor seguridad

  const tabs: Tab[] = useMemo(() => {
    console.log(current, ' ass')
    if (!current?.children) return []
    return current.children
      .filter(it => it.name?.startsWith('tab:'))
      .map(tab => ({
        key: tab.name,
        title: tab.title,
        route: tab.route,
      }))
  }, [current])

  const selectedTab = useMemo(() => {
    return tabs.find(tab => pathname.startsWith(tab.route ?? ''))
  }, [tabs, pathname])

  const visibleItems: GroupItem[] = useMemo(() => {
    let children: PageMapItem[] = []

    if (tabs.length > 0) {
      const tabData = current?.children?.find(c => c.name === selectedTab?.key)
      children = tabData?.children || []
    } else {
      children = current?.children || []
    }

    return children.map(child => {
      if (child.name?.startsWith('group:')) return { ...child, type: 'group' as GroupType }
      if (child.name?.startsWith('dropdown:')) return { ...child, type: 'dropdown' as GroupType }
      return { ...child, type: 'page' as GroupType }
    })
  }, [current, tabs, selectedTab])

  const renderNestedItem = (item: PageMapItem, currentPath: string, depth = 0) => {
    const isActive = item.route === currentPath
    const paddingLeft = `pl-${depth * 4 + 4}`

    return (
      (item.title || item.name) ?
        <Anchor
          key={item.route + item.name}
          href={item.route || '#'}
          className={`block py-1 px-2 rounded-md text-sm transition-colors duration-150 ease-in-out
          ${paddingLeft}
          ${isActive
              ? 'bg-primary/50 text-background font-medium'
              : 'text-secondary hover:bg-secondary/10 hover:text-primary'
            }`}
        >
          {item.title == '' ? item.name : item.title}
        </Anchor> : <span className="hidden" key={`${currentPath}-${depth}`}></span>

    )
  }

  return (
    <aside className="sticky top-0 h-screen w-64 flex-shrink-0 overflow-y-auto bg-background border-r border-secondary/10 px-4 py-6">
      {/* Pestañas (Tabs) si existen */}
      {tabs.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-4 mb-4 border-b border-secondary/10">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => router.push(tab.route ?? '#')}
              className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-150 ease-in-out
                ${tab.route === selectedTab?.route
                  ? 'bg-primary text-background' // Pestaña activa: fondo sólido, texto contrastante
                  : 'text-secondary hover:bg-secondary/20 hover:text-primary border border-transparent hover:border-secondary/30' // Pestaña inactiva: texto secundario, hover sutil
                }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      )}

      <nav className="space-y-1">
        {visibleItems.map(item => {
          switch (item.type) {
            case 'group':
              return (
                <div key={item.name} className="mb-4"> {/* Margen inferior para separar grupos */}
                  <div className="text-xs font-semibold uppercase text-secondary/60 mb-2 px-2 tracking-wide">
                    {item.title}
                  </div>
                  <div className="space-y-1">
                    {item.children?.map(child => renderNestedItem(child, pathname, 1))}
                  </div>
                </div>
              )

            case 'dropdown':
              const isDropdownOpen = pathname.startsWith(item.route!) || item.children?.some(child => pathname.startsWith(child.route!));

              return (
                <details key={item.name} open={isDropdownOpen} className="group cursor-pointer">
                  <summary className="flex items-center justify-between py-1 px-2 text-sm font-medium rounded-md text-secondary hover:bg-secondary/10 hover:text-primary transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    <span>{item.title}</span>
                    {/* Icono de flecha que rota */}
                    <svg
                      className="w-4 h-4 text-primary transition-transform duration-200 group-open:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </summary>
                  <div className="mt-1 space-y-1 pl-4 border-l border-secondary/20 ml-2"> {/* Indentación y línea vertical */}
                    {item.children?.map(child => renderNestedItem(child, pathname, 1))}
                  </div>
                </details>
              )

            case 'page':
              return renderNestedItem(item, pathname)

            default:
              renderNestedItem(item, pathname)
          }
        })}
      </nav>
    </aside>
  )
}
