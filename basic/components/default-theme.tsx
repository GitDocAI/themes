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
      <div className='min-h-screen w-full bg-background/90 flex flex-col justify-between relative 2xl:container mx-auto'>
        <Navbar navitems={themeinfo.navbar} versions={versions}
          logo={logo}
          defaultTheme={themeinfo.defaultThemeMode ?? ''}
        />
        <TabList versions={versions} tablist={tabs} />
        <div className='flex text-secondary flex-1 flex-col'>
          <div className=" px-4 flex flex-col sm:flex-row flex-1">
            <Sidebar themeinfo={themeinfo} versions={versions} tabs={tabs} />
            <div className="flex flex-col gap-1 w-full flex-1 min-h-0">
              <main className="flex-1 flex flex-row overflow-y-auto">
                {children}
              </main>
              <PrevNextNavigation themeinfo={themeinfo} versions={versions} tabs={tabs} />
            </div>
          </div>
          <Footer name={themeinfo.name} items={themeinfo.footer} logo={logo} />
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
  const versiontabs = (itemContainer as NavigationVersion).tabs
  if (versiontabs) {
    return versiontabs.map((tab: NavigationTab): string[] => (getPathsFromTabOrVersion(tab))).flat()
  }
  return itemContainer.items?.map((it: NavigationItem) => getPaths(it)).flat() ?? []
}

function getPaths(original: NavigationItem): string[] {
  switch (original.type) {
    case 'page':
      return [original.page.split('.')[0]]
    case 'group':
      return original.children.map((ch: NavigationItem) => (getPaths(ch))).flat()
    case 'dropdown':
      return original.children.map((ch: NavigationItem) => (getPaths(ch))).flat()
    default:
      return []
  }
}

