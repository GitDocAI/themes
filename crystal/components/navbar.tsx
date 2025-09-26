'use client'

import { Anchor } from 'nextra/components'
import type { FC, ReactNode } from 'react'
import { useState } from 'react'
import ThemeToggle from './theme-toggle'
import type { NavBarItem } from '../models/ThemeInfo'
import VersionSwitcher from './VersionSwitcher'
import { Version } from '@/models/InnerConfiguration'
import SearchBar from './searchbar'

export const Navbar: FC<{
  navitems: NavBarItem[]
  logo: ReactNode
  defaultTheme: string,
  versions: Version[]
}> = ({ navitems, versions, logo, defaultTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const showVersionSwitcher = true

  return (
    <>
      {/* Estilos dinámicos para botones según color primario */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-button {
              background: var(--gradient-primary);
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 12px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(8px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
              transition: all 0.3s ease;
              font-weight: 500;
            }

            .custom-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
              border-color: rgba(255, 255, 255, 0.2);
            }

            .navbar-link {
              position: relative;
              padding: 0.5rem 0.75rem;
              border-radius: 8px;
              transition: all 0.2s ease;
            }

            .navbar-link:hover {
              background: rgba(var(--color-accent-blue), 0.1);
              transform: translateY(-1px);
            }

            .dark-theme .navbar-link:hover {
              background: rgba(var(--color-accent-blue), 0.15);
            }
          `
        }}
      />

      <nav className='sticky top-0 left-0 right-0 w-full z-50 glass text-primary border-b border-crystal-200/10 animate-fade-in'>
        <div className='2xl:container mx-auto px-4 py-3 flex items-center justify-between h-16'>
          <div className='flex items-center space-x-3'>
            {logo && <div className='flex-shrink-0'>{logo}</div>}
            {showVersionSwitcher ? <VersionSwitcher versions={versions} /> : <></>}
          </div>

          <span className="hidden sm:block lg:min-w-sm  max-w-md">
            <SearchBar />
          </span>

          <div className='hidden md:flex items-center space-x-6'>
            {(navitems??[]).map(item => (
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
            <span className="block sm:hidden">
              <SearchBar />
            </span>
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
          <div className='md:hidden glass-card border-t border-crystal-200/30 p-6 animate-slide-up fixed right-4 top-20 rounded-2xl shadow-glass min-w-[200px]'>
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
