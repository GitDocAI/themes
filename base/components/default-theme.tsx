import type { PageMapItem } from 'nextra'
import type { FC, ReactNode } from 'react'
import { Footer } from './footer'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { redirect } from 'next/navigation'
import { type ThemeInfo } from '../models/ThemeInfo'
export const DefaultTheme: FC<{
  children: ReactNode
  pageMap: PageMapItem[]
  themeinfo: ThemeInfo
}> = ({ children, pageMap, themeinfo }) => {

  const versions = themeinfo.navigation.versions?.map(v => v.version) ?? []

  let logo = (<div></div>)
  if (themeinfo.logo) {
    logo = (
      <picture>
        <img src={themeinfo.logo.dark} alt="Logo" />
      </picture>)
  }

  if (!themeinfo.navigation.versions) {
    redirect(getRedirection(themeinfo.navigation))
  }



  return (
    <div className='min-h-screen flex flex-col justify-between relative'>
      <Navbar navitems={themeinfo.navbar} versions={versions}
        logo={logo} name={themeinfo.name}
      />
      <div className='flex bg-background text-secondary min-h-full flex-1'>
        <Sidebar pageMap={pageMap} />
        <div className="flex flex-col gap-1 w-full flex-1">
          <main className=" flex-1 flex flex-row">
            {children}
          </main>
          <Footer name={themeinfo.name} items={themeinfo.footer} logo={logo} />
        </div>
      </div>
    </div>
  )
}

function getRedirection(element: any) {
  if (element.versions) {
    return getRedirection(element.versions[0])
  }
  if (element.tabs) {
    return getRedirection(element.tabs[0])
  }
  if (element.children) {
    return getRedirection(element.children[0])
  }
  return element.page
}



