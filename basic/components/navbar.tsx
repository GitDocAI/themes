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
  const showVersionSwitcher = versions.length > 1

  return (
    <>
      {/* Estilos dinámicos para botones según color primario */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-button {
              background-color: rgb(var(--color-primary));
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 9999px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }

            .custom-button:hover {
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
              opacity: 0.9;
            }

            .dark-theme .custom-button {
              background-color: rgb(var(--color-primary));
              color: white;
            }
          `
        }}
      />

      <nav className='sticky top-0 left-0 right-0 z-50 bg-background text-primary border-x-0 border-b border-secondary/10 '>
        <div className='px-4 py-3 flex items-center justify-between h-16'>
          <div className='flex items-center space-x-3'>
            {logo && <div className='flex-shrink-0'>{logo}</div>}
            {showVersionSwitcher ? <VersionSwitcher versions={versions} /> : <></>}
          </div>

          <span className="hidden sm:block lg:min-w-sm  max-w-md">
            <SearchBar />
          </span>

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
          <div className='md:hidden bg-background border-t border-secondary p-4 animate-fade-in-down fixed right-0'>
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
