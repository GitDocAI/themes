'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { redirect } from 'next/navigation'

const VersionSwitcher = ({ versions = [], defaultVersion, placeholder = 'Select a version' }) => {
  const pathname = usePathname()
  const inputRef = useRef(null)

  const current = pathname?.split('/')[1]
  const [selectedVersion, setSelectedVersion] = useState(current ?? defaultVersion)
  const [filteredVersions, setFilteredVersions] = useState(versions)
  const [isOpen, setIsOpen] = useState(false)

  // Detectar versión desde la URL actual
  useEffect(() => {
    if (!pathname) return
    const current = pathname.split('/')[1]
    if (versions.includes(current)) {
      setSelectedVersion(current)
    } else {
      redirect(`/${defaultVersion}`)
    }
  }, [pathname, versions])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSelectedVersion(value)
    setFilteredVersions(
      versions.filter(v => v.toLowerCase().includes(value.toLowerCase()))
    )
    setIsOpen(true)
  }

  const handleOptionClick = (version) => {
    setSelectedVersion(version)
    setIsOpen(false)
    const newPath = `/${version}`
    redirect(newPath)
  }

  const handleFocus = () => {
    setFilteredVersions(versions)
    setIsOpen(true)
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 100) // Para permitir click antes de cerrar
  }

  const click = (e) => {
    e.preventDefault()
    e.stopPropagation();
  }

  return (
    <div className="relative inline-block ">
      <button
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={click}
        placeholder={placeholder}
        className="x:whitespace-nowrap x:transition-colors x:min-w-6 x:overflow-hidden x:text-ellipsis x:focus-visible:nextra-focus x:ring-inset bg-background border-primary text-secondary border rounded-full px-3 py-1"
      >
        {selectedVersion || defaultVersion}
      </button>

      {isOpen && filteredVersions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-20 bg-zinc-900  rounded-md text-secondary shadow-lg  overflow-y-auto">
          {filteredVersions.map(version => (
            <li
              key={version}
              onMouseDown={() => handleOptionClick(version)}
              className={`px-4 w-full py-2 hover:bg-background bg-background border border-background/30  cursor-pointer ${version === selectedVersion ? 'bg-background/80 !text-primary font-bold' : ''}`}
            >
              {version}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VersionSwitcher
