'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { redirect } from 'next/navigation'
import { Version } from '@/models/InnerConfiguration'

const VersionSwitcher = ({ versions }: { versions: Version[] }) => {

  const pathname = usePathname()
  const inputRef = useRef(null)

  const [selectedVersion, setSelectedVersion] = useState(versions[0]?.version || 'v1.0.0')
  const [filteredVersions, setFilteredVersions] = useState(versions)
  const [isOpen, setIsOpen] = useState(false)

  // Si no hay versiones, mostrar una versión por defecto
  if (!versions || versions.length === 0) {
    return (

      <div className="w-full flex items-center px-4 py-3 bg-primary border border-primary rounded-lg text-primary font-medium text-sm shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <span>v1.0.0</span>
        </div>
      </div>
    )
  }

  // Detectar versión desde la URL actual
  useEffect(() => {
    if (!pathname) return
    const current = versions.find(v => v.paths.includes(pathname)) ?? versions[0]
    if (!current) return
    if (versions.find(v => (v.version == current!.version))) {
      setSelectedVersion(current!.version)
    } else {
      redirect(versions[0].paths[0])
    }
  }, [pathname, versions])

  const handleInputChange = (e: any) => {
    const value = e.target.value
    setSelectedVersion(value)
    setFilteredVersions(
      e
    )
    setIsOpen(true)
  }

  const handleOptionClick = (version: string) => {
    setSelectedVersion(version)
    setIsOpen(false)
    const newPath = versions.find(v => v.version == version)!.paths[0]
    redirect(newPath)
  }

  const handleFocus = () => {
    setFilteredVersions(versions)
    setIsOpen(true)
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 100)
  }

  const click = (e: any) => {
    e.preventDefault()
    e.stopPropagation();
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <button
        ref={inputRef}
        onClick={click}
        onBlur={handleBlur}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary hover:bg-primary border border-primary hover:border-primary rounded-lg text-primary font-medium text-sm transition-all duration-200 hover:shadow-md group"
      >
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <span>{selectedVersion}</span>
        </div>
        {filteredVersions.length > 1 && (
          <i className={`pi pi-chevron-down text-xs ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-primary group-hover:text-primary`}></i>
        )}
      </button>

      {isOpen && filteredVersions.length > 1 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-primary rounded-lg shadow-xl overflow-hidden">
          {filteredVersions.map(version => (
            <li
              key={version.version}
              onMouseDown={() => handleOptionClick(version.version)}
              className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center space-x-2 text-sm ${
                version.version === selectedVersion
                  ? 'bg-primary text-primary font-medium border-l-2 border-primary'
                  : 'text-primary hover:bg-primary hover:text-primary'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${version.version === selectedVersion ? 'bg-primary' : 'bg-primary'}`}></div>
              <span>{version.version}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VersionSwitcher
