import type { PageMapItem } from 'nextra'
import { type FC, type ReactNode } from 'react'
import { Footer } from './footer'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { Banner } from './banner'
import { type ThemeInfo, type NavigationItem, type NavigationTab, NavigationVersion } from '../models/ThemeInfo'
import { TabList } from './tabs'
import { Version, Tab } from '@/models/InnerConfiguration'
import { Logo } from './logo'
import { PrevNextNavigation } from './prev-next-navigation'
import {splitPageUrl} from '../shared/splitPageUrl'
import VersionSwitcher from './VersionSwitcher'
export const DefaultTheme: FC<{
  children: ReactNode
  pageMap: PageMapItem[]
  themeinfo: ThemeInfo
}> = ({ children, pageMap, themeinfo }) => {

  const versions = calculateVersions(themeinfo)
  const tabs = calculateTabs(themeinfo)


  let logo = (<div></div>)
  if (themeinfo.logo) {
    logo = (
      <Logo light={themeinfo.logo.light} dark={themeinfo.logo.dark}></Logo>)
  }


  return (
    <>
      {themeinfo.banner ? <Banner content={themeinfo.banner} /> : <></>}
      <div className='min-h-screen w-full flex flex-col justify-between relative 2xl:container mx-auto'>
        <Navbar navitems={themeinfo.navbar} versions={versions}
          logo={logo}
          defaultTheme={themeinfo.defaultThemeMode ?? ''}
          tablist={tabs}
        />
        <div className='flex text-secondary flex-1 flex-col'>
          {/* Version Switcher debajo del logo */}
          <div className="px-4 py-4">
            <div className="w-64">
              <VersionSwitcher versions={versions} />
            </div>
          </div>
          <div className="px-4 flex flex-col sm:flex-row flex-1">
            <Sidebar themeinfo={themeinfo} versions={versions} tabs={tabs} />
            <div className="flex flex-col gap-1 w-full flex-1 min-h-0">
              <main className="flex-1
                  grid
                  grid-cols-1
                  grid-rows-[auto_auto]

                  [grid-template-areas:'content''nav''toc''footer']

                  lg:grid-cols-[auto_auto]
                  lg:grid-rows-[auto_auto]
                  lg:[grid-template-areas:'content_toc''nav_toc''footer_toc']
                  p-4

                  gap-4">
                  {children}
                  <PrevNextNavigation themeinfo={themeinfo} versions={versions} tabs={tabs} />
                  <Footer name={themeinfo.name} items={themeinfo.footer} logo={logo} />
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  )

}

function calculateVersions(themeinfo: ThemeInfo): Version[] {
  let versions: Version[] = []
  const _mversions = themeinfo.navigation.versions ?? []

  _mversions.forEach((v: NavigationVersion) => {
    const tabs: string[] = []
    if (v.tabs) {
      tabs.push(...v.tabs.map(t => t.tab))
    }
    versions.push({
      version: v.version,
      tabs,
      paths: getPathsFromTabOrVersion(v)
    })
  })

  return versions
}


function calculateTabs(themeinfo: ThemeInfo): Tab[] {
  let tabs: Tab[] = []
  const _mvtabs = themeinfo.navigation.tabs ?? []
  const pageversions = themeinfo.navigation.versions ?? []
  _mvtabs.push(...pageversions.filter((v: NavigationVersion) => !!v.tabs).map(v => v.tabs!).flat())
  _mvtabs.forEach((v: NavigationTab) => {
    tabs.push({
      tab: v.tab,
      paths: getPathsFromTabOrVersion(v)
    })
  })

  return tabs
}

function getPathsFromTabOrVersion(itemContainer: NavigationTab | NavigationVersion) {
  if ('tab' in itemContainer) {
    return itemContainer.items?.map((it: NavigationItem) => getPaths(it)).flat() ?? [];
  } else if ('tabs' in itemContainer) {
    return itemContainer.tabs!.map((tab: NavigationTab): string[] => (getPathsFromTabOrVersion(tab))).flat();
  }
  return [];
}



function getPaths(original: NavigationItem): string[] {
  if(!original.type && (original as any).page){
    (original as any).type = 'page'
  }
  switch (original.type) {
    case 'openapi':
    case 'swagger':
    case 'page':
      return [splitPageUrl(original.page)]
    case 'group':
      const next_path = `{}`
      return original.children.map((ch: NavigationItem) => (getPaths(ch))).flat()
    case 'dropdown':
      return original.children.map((ch: NavigationItem) => (getPaths(ch))).flat()
    default:
      return []
  }
}

