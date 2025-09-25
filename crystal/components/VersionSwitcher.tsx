'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { redirect } from 'next/navigation'
import { Version } from '@/models/InnerConfiguration'

const VersionSwitcher = ({ versions }: { versions: Version[] }) => {

  const pathname = usePathname()
  const inputRef = useRef(null)

  const [selectedVersion, setSelectedVersion] = useState(versions[0].version)
  const [filteredVersions, setFilteredVersions] = useState(versions)
  const [isOpen, setIsOpen] = useState(false)

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
  }

  return (
    <div className="relative inline-block ">
      <button
        ref={inputRef}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={click}
        className="x:whitespace-nowrap x:transition-colors x:min-w-6 x:overflow-hidden x:text-ellipsis x:focus-visible:nextra-focus x:ring-inset bg-background border-secondary/30 text-secondary border rounded-full px-3 py-1 text-sm"
      >
        {selectedVersion}
      </button>

      {isOpen && filteredVersions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-20 bg-background border border-secondary/20 rounded-md text-secondary shadow-lg overflow-y-auto">
          {filteredVersions.map(version => (
            <li
              key={version.version}
              onMouseDown={() => handleOptionClick(version.version)}
              className={`px-4 text-sm w-full py-2 hover:bg-background bg-background border border-background/30  cursor-pointer ${version.version === selectedVersion ? 'bg-background/80 !text-primary font-bold' : ''}`}
            >
              {version.version}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VersionSwitcher
