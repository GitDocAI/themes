'use client'

import { Anchor } from 'nextra/components'
import type { FC, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './theme-toggle'
import type { NavBarItem } from '../models/ThemeInfo'
import VersionSwitcher from './VersionSwitcher'
import { Version, Tab } from '@/models/InnerConfiguration'
import SearchBar from './searchbar'


export const Navbar: FC<{
  navitems: NavBarItem[]
  logo: ReactNode
  defaultTheme: string,
  versions: Version[]
  tabs: Tab[]
  colors?: {
    light?: string
    dark?: string
  }
}> = ({ navitems, versions, tabs, logo, defaultTheme, colors }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const showVersionSwitcher = true
  const pathname = usePathname()
  const router = useRouter()

  // Convert hex to RGB for CSS variables
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : '22 163 74'
  }

  useEffect(() => {
    if (colors?.light) {
      document.documentElement.style.setProperty('--color-accent-primary', hexToRgb(colors.light))
    }
  }, [colors])

  const [visibleTabs, setVisibleTabs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    if (versions.length > 0) {
      const matchedVersion = versions.find((v) =>
        v.paths.includes(pathname)
      )
      setVisibleTabs(matchedVersion?.tabs || [])
    } else {
      setVisibleTabs(tabs.map((t) => t.tab))
    }

    const matchedTab = tabs.find((t) =>
      t.paths.includes(pathname)
    )
    setActiveTab(matchedTab?.tab || null)
  }, [pathname, versions, tabs])

  const handleTabClick = (tabName: string) => {
    const tabInfo = tabs.find((t) => t.tab === tabName)
    const firstPath = tabInfo?.paths[0]
    if (firstPath) {
      router.push(firstPath)
    }
  }

  return (
    <>
      {/* Estilos dinámicos para botones según color primario - Nova-inspired */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-button {
              background: ${colors?.light || '#16a34a'};
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              border: 1px solid transparent;
              transition: all 0.3s ease;
              font-weight: 500;
              font-size: 0.875rem;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }

            .custom-button:hover {
              background: ${colors?.light || '#16a34a'}cc;
              transform: translateY(-1px);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            .dark .custom-button {
              background: ${colors?.dark || '#22c55e'};
            }

            .dark .custom-button:hover {
              background: ${colors?.light || '#16a34a'};
            }

            .navbar-link {
              position: relative;
              padding: 0.5rem 0.75rem;
              border-radius: 6px;
              transition: all 0.2s ease;
              font-size: 0.875rem;
            }

            .navbar-link:hover {
              background: rgba(var(--color-accent-primary), 0.08);
              transform: translateY(-0.5px);
            }

            .dark-theme .navbar-link:hover {
              background: rgba(var(--color-accent-primary), 0.12);
            }
          `
        }}
      />

      <nav className='sticky top-0 left-0 right-0 w-full z-50 text-primary animate-fade-in backdrop-blur-xl shadow-lg'>
        <div className='mx-auto px-4 py-3 flex items-center justify-between h-16'>
          <div className='flex items-center space-x-3'>
            {logo && <div className='flex-shrink-0'>{logo}</div>}
            {showVersionSwitcher ? <VersionSwitcher versions={versions} /> : <></>}
          </div>

          {/* Navigation menu integrado en el navbar */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            {visibleTabs.length > 0 && (
              <div className="flex gap-0.5 bg-nova-100/60 dark:bg-nova-800/60 p-1 rounded-full border border-nova-200/40 dark:border-nova-700/40 shadow-sm backdrop-blur-md min-w-max">
                {visibleTabs.map((tabName) => {
                  const isActive = tabName === activeTab

                  return (
                    <button
                      key={tabName}
                      onClick={() => handleTabClick(tabName)}
                      className={`relative font-medium transition-all duration-300 px-3 py-1.5 rounded-full text-sm whitespace-nowrap cursor-pointer magnetic-effect ${isActive
                        ? 'bg-accent-primary/10 dark:bg-accent-primary/15 text-accent-primary shadow-lg shadow-accent-primary/20 border border-accent-primary/20 transform scale-105 float-on-hover'
                        : 'text-nova-600 dark:text-nova-400 hover:text-accent-primary hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10 hover:shadow-md shimmer-effect'
                        }`}
                    >
                      {tabName}
                      {isActive && (
                        <div className="absolute -inset-0.5 rounded-full bg-accent-primary/5 blur-sm pointer-events-none"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className='hidden md:flex items-center space-x-4'>
            <div className="w-52">
              <SearchBar />
            </div>
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
          </div>

          <div className='md:hidden flex items-center space-x-4'>
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
          <div className='md:hidden glass-card border-t border-nova-200/30 p-6 animate-slide-up fixed right-4 top-20 rounded-xl shadow-nova min-w-[280px] dark:border-nova-700/30'>
            <div className="mb-4">
              <SearchBar />
            </div>
            <ul className='flex flex-col items-center space-y-4'>
              {navitems.map(item => (
                <Anchor
                  key={item.reference}
                  href={item.reference}
                  className={
                    `transition-all duration-200 ease-in-out font-medium flex flex-row items-center w-full text-center ${item.type === 'button'
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
