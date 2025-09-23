'use client'

import { Anchor } from 'nextra/components'
import type { FC, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import ThemeToggle from './theme-toggle'
import type { NavBarItem } from '../models/ThemeInfo'
import VersionSwitcher from './VersionSwitcher'
import { Version, Tab } from '@/models/InnerConfiguration'
import SearchBar from './searchbar'
import { usePathname, useRouter } from 'next/navigation'

export const Navbar: FC<{
  navitems: NavBarItem[]
  logo: ReactNode
  defaultTheme: string,
  versions: Version[]
  tablist: Tab[]
}> = ({ navitems, versions, logo, defaultTheme, tablist }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const showVersionSwitcher = true
  const pathname = usePathname()
  const router = useRouter()
  const [visibleTabs, setVisibleTabs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    if (versions.length > 0) {
      const matchedVersion = versions.find((v) =>
        v.paths.includes(pathname)
      )
      setVisibleTabs(matchedVersion?.tabs || [])
    } else {
      setVisibleTabs(tablist.map((t) => t.tab))
    }

    const matchedTab = tablist.find((t) =>
      t.paths.includes(pathname)
    )
    setActiveTab(matchedTab?.tab || null)
  }, [pathname, versions, tablist])

  const handleTabClick = (tabName: string) => {
    const tabInfo = tablist.find((t) => t.tab === tabName)
    const firstPath = tabInfo?.paths[0]
    if (firstPath) {
      router.push(firstPath)
    }
  }

  return (
    <>
      {/* Estilos dinámicos para botones según color primario */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-button {
              background: linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.8));
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 9999px;
              box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
              border: 1px solid rgb(var(--color-primary) / 0.3);
            }

            .custom-button:hover {
              box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
              transform: translateY(-1px);
              transition: all 0.2s ease;
            }

            .dark-theme .custom-button {
              background: linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-primary) / 0.9));
              box-shadow: 0 2px 8px rgba(255, 69, 0, 0.4);
            }

            .navbar-link {
              color: rgba(55, 65, 81, 0.9) !important;
              font-weight: 500;
              text-shadow: 0 1px 2px rgba(255, 255, 255, 0.1);
            }

            .navbar-link:hover {
              color: rgba(55, 65, 81, 1) !important;
              text-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);
            }

            .dark-theme .navbar-link {
              color: rgba(255, 255, 255, 0.9) !important;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }

            .dark-theme .navbar-link:hover {
              color: rgba(255, 255, 255, 0.95) !important;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }

            .navbar-tabs-container {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              padding: 0.25rem;
              backdrop-filter: blur(10px);
            }

            .dark-theme .navbar-tabs-container {
              background: rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .navbar-tab {
              padding: 0.375rem 0.75rem;
              font-weight: 400;
              color: rgba(255, 255, 255, 0.7);
              transition: all 0.2s ease;
              border-radius: 0.75rem;
              font-size: 0.875rem;
              margin: 0 0.125rem;
              border: none;
              background: transparent;
            }

            .navbar-tab:hover {
              color: rgba(255, 255, 255, 0.9);
              background: rgba(255, 255, 255, 0.1);
            }

            .navbar-tab.active {
              color: white;
              background: rgba(255, 255, 255, 0.15);
              font-weight: 500;
            }
          `
        }}
      />

      <nav className='sticky top-0 left-0 right-0 z-50 navbar-gradient backdrop-blur-xs text-primary border-x-0 border-b border-secondary/10'>
        <div className='px-4 py-3 flex items-center justify-between h-16'>
          <div className='flex items-center space-x-3'>
            {logo && <div className='flex-shrink-0'>{logo}</div>}
          </div>

          {/* Tabs centrados */}
          {visibleTabs.length > 0 && (
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="navbar-tabs-container">
                <div className="flex items-center">
                  {visibleTabs.map((tabName) => {
                    const isActive = tabName === activeTab
                    return (
                      <button
                        key={tabName}
                        onClick={() => handleTabClick(tabName)}
                        className={`navbar-tab ${isActive ? 'active' : ''}`}
                      >
                        {tabName}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className='hidden md:flex items-center space-x-6'>
            {navitems.map(item => (
              <Anchor
                key={item.reference}
                href={item.reference}
                className={
                  `hover:text-secondary transition-colors duration-200 ease-in-out font-medium flex flex-row items-center ${item.type === 'button'
                    ? 'custom-button'
                    : 'navbar-link text-primary'
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Anchor>
            ))}
            <ThemeToggle defaultMode={defaultTheme} />
            <SearchBar />
          </div>

          <div className='md:hidden flex items-center space-x-4'>
            <SearchBar />
            <ThemeToggle defaultMode={defaultTheme} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='text-primary focus:outline-none focus:ring-2 focus:ring-secondary rounded-md p-1'
              aria-label='Toggle mobile menu'
            >
              {isMobileMenuOpen ? (
                <svg className='w-6 h-6 text-secondary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              ) : (
                <svg className='w-6 h-6 text-secondary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16' />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className='md:hidden bg-background border-t border-secondary p-4 animate-fade-in-down fixed right-0'>
            {/* Tabs móviles */}
            {visibleTabs.length > 0 && (
              <div className="mb-4 flex justify-center">
                <div className="navbar-tabs-container">
                  <div className="flex flex-wrap justify-center">
                    {visibleTabs.map((tabName) => {
                      const isActive = tabName === activeTab
                      return (
                        <button
                          key={tabName}
                          onClick={() => handleTabClick(tabName)}
                          className={`navbar-tab ${isActive ? 'active' : ''}`}
                        >
                          {tabName}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <ul className='flex flex-col items-center space-y-3'>
              {navitems.map(item => (
                <Anchor
                  key={item.reference}
                  href={item.reference}
                  className={
                    `hover:text-secondary transition-colors duration-200 ease-in-out font-medium flex flex-row items-center ${item.type === 'button'
                      ? 'custom-button'
                      : 'navbar-link text-primary'
                    }`
                  }
                  style={{ textDecoration: 'none' }}
                >
                  {item.label}
                </Anchor>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  )
}
