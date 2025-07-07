import type { Metadata } from 'next'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import type { FC, ReactNode } from 'react'
import { DefaultTheme } from '../components/default-theme'
import './global.css'
import { ThemeInfo } from '../models/ThemeInfo'
export const metadata: Metadata = {
  title: {
    absolute: '',
    template: '%s'
  }
}


import site from '../dockitai.config.json'


const RootLayout: FC<{ children: ReactNode }> = async ({ children }) => {
  const pageMap = await getPageMap()
  return (
    <html lang="en" dir="ltr">
      <Head faviconGlyph="✦" />
      <body style={{ margin: 0 }} className="bg-background">
        <DefaultTheme themeinfo={site as ThemeInfo} pageMap={pageMap} >{children}</DefaultTheme>
      </body>
    </html>
  )
}

export default RootLayout


