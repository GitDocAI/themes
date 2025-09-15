'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type Version, type Tab } from '@/models/InnerConfiguration'

export const TabList = ({
  versions,
  tablist,
}: {
  versions: Version[]
  tablist: Tab[]
}) => {
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
      setVisibleTabs(tablist.map((t) => t.tab))
    }

    const matchedTab = tablist.find((t) =>
      t.paths.includes(pathname)
    )
    setActiveTab(matchedTab?.tab || null)
  }, [pathname, versions, tablist])

  if (visibleTabs.length === 0) return null

  const handleTabClick = (tabName: string) => {
    const tabInfo = tablist.find((t) => t.tab === tabName)
    console.log("asasasasass",tabInfo,"joiibpjpoi ")
    const firstPath = tabInfo?.paths[0]
    if (firstPath) {
      router.push(firstPath)
    }
  }

  return (
    <div className="pt-2 container sticky top-14 ">
      <div className="px-4 !text-xs">
        <div className="flex gap-4  overflow-x-auto">
          {visibleTabs.map((tabName) => {
            const isActive = tabName === activeTab

            return (
              <button
                key={tabName}
                onClick={() => handleTabClick(tabName)}
                className={`font-medium transition-colors pb-2 border-b-2 ${isActive
                  ? 'tab-active'
                  : 'border-transparent text-secondary tab-hover'
                  }`}
              >
                {tabName}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
