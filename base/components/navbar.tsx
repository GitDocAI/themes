'use client'

import { Anchor } from 'nextra/components'
import type { FC, ReactNode } from 'react'
import { useState } from 'react' // Import useState
import ThemeToggle from './theme-toggle'
import type { NavBarItem } from '../models/ThemeInfo'
import VersionSwitcher from './VersionSwitcher'
import { Version } from '@/models/InnerConfiguration'


export const Navbar: FC<{ navitems: NavBarItem[], logo: ReactNode, name: string, versions: Version[] }> = ({ navitems, versions, logo, name }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // State for mobile menu
  const showVersionSwitcher = versions.length > 1

  return (
    <nav className='sticky top-0 left-0 right-0 z-50 bg-background text-primary border-b border-secondary/10 shadow-md'>
      <div className='container mx-auto px-4 py-3 flex items-center justify-between h-16'>
        <div className='flex items-center space-x-3'>
          {logo && <div className='flex-shrink-0'>{logo}</div>}
        </div>

        <div className='hidden md:flex items-center space-x-6'>
          {navitems.map(item => (
            <Anchor
              key={item.reference}
              href={item.reference}
              className={
                ` hover:text-secondary transition-colors duration-200 ease-in-out font-medium flex flex-row items-center
                  ${item.type === 'button' ? 'px-2 py-1 bg-primary/90 text-background  rounded-full' : 'text-primary'}`
              }
              style={{ textDecoration: 'none' }}
            >
              {item.label}
            </Anchor>
          ))}
          {showVersionSwitcher && (
            <VersionSwitcher versions={versions} />
          )}
          <ThemeToggle />
        </div>

        <div className='md:hidden flex items-center space-x-4'>
          {showVersionSwitcher && (
            <VersionSwitcher versions={versions} />
          )}
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='text-primary focus:outline-none focus:ring-2 focus:ring-secondary rounded-md p-1'
            aria-label='Toggle mobile menu'
          >
            {isMobileMenuOpen ? (
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            ) : (
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h16M4 18h16'></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden bg-background border-t border-secondary py-4 animate-fade-in-down'>
          <ul className='flex flex-col items-center space-y-3'>
            {navitems.map(item => (
              <li key={item.reference}>
                <Anchor
                  href={item.reference}
                  className='py-2 px-4 text-primary hover:bg-secondary hover:text-background rounded-md transition-colors duration-200 text-lg font-medium w-full text-center flex flex-row items-center'
                  style={{ textDecoration: 'none' }}
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on item click
                >
                  {item.label}
                </Anchor>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
