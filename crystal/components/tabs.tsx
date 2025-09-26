'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type Version, type Tab } from '@/models/InnerConfiguration'

export const TabList = ({
  versions,
  tablist,
  colors,
}: {
  versions: Version[]
  tablist: Tab[]
  colors?: { light?: string; dark?: string }
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
    const firstPath = tabInfo?.paths[0]
    if (firstPath) {
      router.push(firstPath)
    }
  }

  return (
    <>
      {/* Estilos dinámicos para tabs según colores de configuración */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .tab-active-custom {
            border-color: ${colors?.light || '#22c55e'} !important;
            color: ${colors?.light || '#22c55e'} !important;
            background: linear-gradient(135deg, ${colors?.light || '#22c55e'}, ${colors?.dark || '#16a34a'});
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
            position: relative;
          }
          .tab-active-custom::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: -8px;
            right: -8px;
            height: 3px;
            background: linear-gradient(135deg, ${colors?.light || '#22c55e'}, ${colors?.dark || '#16a34a'});
            border-radius: 2px;
            animation: slideIn 0.3s ease-out;
          }
          .tab-hover-custom:hover {
            color: ${colors?.light || '#22c55e'} !important;
            cursor: pointer;
            transform: translateY(-2px);
            transition: all 0.2s ease;
            font-weight: 600;
          }
          @keyframes slideIn {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          `,
        }}
      />
      <div className="pt-3 sticky top-16 bg-background/80 backdrop-blur-sm z-40 pb-2">
      <div className="2xl:container mx-auto px-4">
      <div className="text-base">
        <div className="flex gap-6 overflow-x-auto">
          {visibleTabs.map((tabName) => {
            const isActive = tabName === activeTab

            return (
              <button
                key={tabName}
                onClick={() => handleTabClick(tabName)}
                className={`font-semibold transition-all duration-200 px-2 py-3 border-b-3 text-xs lg:text-lg ${isActive
                  ? 'tab-active-custom'
                  : 'border-transparent text-secondary tab-hover-custom'
                  }`}
              >
                {tabName}
              </button>
            )
          })}
        </div>
      </div>
      </div>
      </div>
    </>
  )
}
