'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const VersionSwitcher = ({ versions = [], defaultVersion, placeholder = 'Select a version' }) => {
  const pathname = usePathname()
  const inputRef = useRef(null)

  const [selectedVersion, setSelectedVersion] = useState('')
  const [filteredVersions, setFilteredVersions] = useState(versions)
  const [isOpen, setIsOpen] = useState(false)

  // Detectar versión desde la URL actual
  useEffect(() => {
    if (!pathname) return
    const current = pathname.split('/')[1]
    if (current === '') {
      window.location.href = `/${defaultVersion}`
      return
    }
    if (versions.includes(current)) {
      setSelectedVersion(current)
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
    window.location.href = newPath
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
    <div className="relative inline-block w-48">
      <button
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={click}
        placeholder={placeholder}
        className=" px-4 py-1 bg-zinc-900/40 text-white border border-zinc-200 rounded-full"
      >
        {selectedVersion || defaultVersion}
      </button>

      {isOpen && filteredVersions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-20 bg-zinc-900 border border-zinc-200 rounded-md text-white shadow-lg max-h-60 overflow-y-auto">
          {filteredVersions.map(version => (
            <li
              key={version}
              onMouseDown={() => handleOptionClick(version)}
              className={`px-4 py-2 hover:bg-zinc-800 cursor-pointer ${version === selectedVersion ? 'bg-zinc-700 font-bold' : ''}`}
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
