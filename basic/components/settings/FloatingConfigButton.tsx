'use client'
import React from 'react'
import { useConfig } from './ConfigContext'

export const FloatingConfigButton: React.FC = () => {
  const { toggleConfig, isConfigOpen } = useConfig()

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <button
      onClick={toggleConfig}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-linear-to-r from-blue-500 to-purple-600
        hover:from-blue-600 hover:to-purple-700
        shadow-lg hover:shadow-xl
        transition-all duration-300
        flex items-center justify-center
        text-white text-xl
        ${isConfigOpen ? 'rotate-180' : 'rotate-0'}
      `}
      aria-label="Toggle Theme Editor"
      title="Theme Editor"
    >
      <i className="pi pi-cog" />
    </button>
  )
}