'use client'

import { Anchor } from 'nextra/components'
import { NavigationItem, NavigationPage, ThemeInfo } from '../models/ThemeInfo'
import { usePathname } from 'next/navigation'
import { Version, Tab } from '../models/InnerConfiguration'
import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'

export const Sidebar = ({ themeinfo, versions, tabs }: { themeinfo: ThemeInfo, versions: Version[], tabs: Tab[] }) => {
  const pathname = usePathname()

  const [items, setItems] = useState<NavigationItem[]>(themeinfo.navigation.items ?? [])

  function getRedirection(element: any): string {
    if (element.children) {
      return getRedirection(element.children[0])
    }
    return element.page.split('.')[0]
  }




  useEffect(() => {
    if (versions.length > 0) {
      const matchedVersion = versions.find((v) =>
        v.paths.includes(pathname)
      )

      if (!matchedVersion) redirect(versions[0].paths[0])
      if (matchedVersion!.tabs.length > 0) {
        const matchedTab = tabs.find(t => t.paths.includes(pathname))
        const _items = themeinfo.navigation.versions!.find(v => v.version == matchedVersion?.version)!
        setItems(_items.tabs!.find(t => t.tab == matchedTab!.tab)!.items!)

      } else {
        const _items = themeinfo.navigation.versions!.find(v => v.version == matchedVersion?.version)!.items!
        setItems(_items)
      }
    } else if (tabs.length > 0) {
      const matchedTab = tabs.find(t => t.paths.includes(pathname))
      if (!matchedTab) redirect(tabs[0].paths[0])
      const _items = themeinfo.navigation.tabs!.find(v => v.tab == matchedTab!.tab)!.items!
      setItems(_items)
    } else if (pathname == '/') {
      redirect(getRedirection(items[0]))
    }
  }, [pathname, versions, tabs])


  const renderNestedItem = (item: NavigationPage, currentPath: string, depth = 0) => {
    const paddingLeft = `pl-${depth * 4 + 4}`
    item.page = item.page?.split('.')[0]
    const isActive = item.page === pathname

    return (
      (item.title) ?
        <Anchor
          key={item.page + item.title}
          href={item.page || '#'}
          className={`block py-1 px-2 rounded-md text-sm transition-colors duration-150 ease-in-out
          ${paddingLeft}
          ${isActive
              ? 'bg-primary/50 text-background font-medium'
              : 'text-secondary hover:bg-secondary/10 hover:text-primary'
            }`}
        >
          {item.title}
        </Anchor> : <span className="hidden" key={`${currentPath}-${depth}`}></span>

    )
  }

  return (
    <aside className="sticky top-0 h-screen w-64 flex-shrink-0 overflow-y-auto bg-background border-r border-secondary/10 px-4 py-6">
      {/* Pestañas (Tabs) si existen */}

      <nav className="space-y-1">
        {items.map(item => {
          switch (item.type) {
            case 'group':
              return (
                <div key={item.title} className="mb-4"> {/* Margen inferior para separar grupos */}
                  <div className="text-xs font-semibold uppercase text-secondary/60 mb-2 px-2 tracking-wide">
                    {item.title}
                  </div>
                  <div className="space-y-1">
                    {item.children?.map(child => renderNestedItem(child as NavigationPage, pathname, 1))}
                  </div>
                </div>
              )

            case 'dropdown':

              return (
                <details key={item.title} open={false} className="group cursor-pointer">
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
                    {item.children?.map(child => renderNestedItem(child as NavigationPage, pathname, 1))}
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
