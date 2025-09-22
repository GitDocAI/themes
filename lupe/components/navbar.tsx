'use client'

import { Anchor } from 'nextra/components'
import type { FC, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './theme-toggle'
import type { NavBarItem } from '../models/ThemeInfo'
import VersionSwitcher from './VersionSwitcher'
import { Version, Tab } from '@/models/InnerConfiguration'


export const Navbar: FC<{
  navitems: NavBarItem[]
  logo: ReactNode
  defaultTheme: string,
  versions: Version[]
  tabs: Tab[]
}> = ({ navitems, versions, tabs, logo, defaultTheme }) => {
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
      {/* Estilos dinámicos para botones según color primario - Prisma-inspired */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-button {
              background: linear-gradient(135deg, rgb(var(--color-accent-primary)), rgb(var(--color-accent-secondary)));
              color: white;
              padding: 0.625rem 1.25rem;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(8px);
              box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);
              transition: all 0.2s ease;
              font-weight: 500;
              font-size: 0.875rem;
            }

            .custom-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 16px rgba(22, 163, 74, 0.25);
              border-color: rgba(255, 255, 255, 0.2);
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
          <div className="flex-1 flex justify-center">
            {visibleTabs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {visibleTabs.map((tabName) => {
                  const isActive = tabName === activeTab

                  return (
                    <button
                      key={tabName}
                      onClick={() => handleTabClick(tabName)}
                      className={`font-medium transition-all duration-200 px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer ${isActive
                        ? 'bg-accent-primary/10 text-accent-primary shadow-sm border border-accent-primary/20'
                        : 'text-secondary hover:text-accent-primary hover:bg-accent-primary/5'
                        }`}
                    >
                      {tabName}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

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
          <div className='md:hidden glass-card border-t border-lupe-200/30 p-6 animate-slide-up fixed right-4 top-20 rounded-xl shadow-lupe min-w-[200px] dark:border-lupe-700/30'>
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
