'use client'
import React from 'react'
import { useConfig } from './ConfigContext'
import { ConfigEditorSidebar } from './ConfigEditorSidebar'
import { FloatingConfigButton } from './FloatingConfigButton'

interface ConfigLayoutWrapperProps {
  children: React.ReactNode
}

export const ConfigLayoutWrapper: React.FC<ConfigLayoutWrapperProps> = ({ children }) => {
  const { isConfigOpen, toggleConfig } = useConfig()

  return (
    <div className="relative min-h-screen">
      {/* Main content with conditional margin */}
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${isConfigOpen ? 'mr-96' : 'mr-0'}
        `}
      >
        {children}
      </div>

      {/* Overlay for mobile/smaller screens */}
      {isConfigOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleConfig}
        />
      )}

      {/* Config Sidebar */}
      <ConfigEditorSidebar />
      
      {/* Floating Button */}
      <FloatingConfigButton />
    </div>
  )
}