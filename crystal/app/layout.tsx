import type { Metadata } from 'next'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import type { FC, ReactNode } from 'react'
import { DefaultTheme } from '../components/default-theme'
import './global.css'
import { ThemeInfo } from '../models/ThemeInfo'
import InvalidConfigPage from '@/components/InvalidConfig'
import { GlobalScript } from '@/components/doc-components/GlobalScript'


export const metadata: Metadata = {
  title: {
    absolute: '',
    template: '%s'
  }
}



import { openapi_path_builder } from '../shared/path_builder';

import raw_site from '../gitdocai.config.json'

const site = openapi_path_builder(raw_site as any)

const RootLayout: FC<{ children: ReactNode }> = async ({ children }) => {
  const pageMap = await getPageMap()


  if (!site || Object.keys(site).length == 0) {
    return (
      <InvalidConfigPage />
    )
  }
  return (
    <html lang="en" dir="ltr" >
      <Head >
        <style>{generateCSSVars(getPageRecords(site as any)) as any}</style>

        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet"/>
        <link rel="icon" href={site.favicon} />
      </Head>
      <body style={{ margin: 0 }} >
        <DefaultTheme themeinfo={site as any} pageMap={pageMap} >{children}</DefaultTheme>
        <GlobalScript />
      </body>
    </html>
  )
}

export default RootLayout


const getPageRecords = (site: ThemeInfo) => {
  const colorRecord: StyleRecord = {
    key: 'primary',
    light: site.colors?.light ?? '#000000',
    dark: site.colors?.dark ?? '#ffffff',
    type: 'color'
  }

  const backgroundRecord: StyleRecord = {
    key: 'bg',
    light: site.background?.colors?.light ?? '#ffffff',
    dark: site.background?.colors?.dark ?? '#000000',
    type: 'color'
  }

  let [bgimglight, bgimgdark] = [null, null] as [string | null, string | null]
  if (site.background?.image) {

    if (typeof site.background.image == "string") {
      bgimglight = site.background.image
      bgimgdark = site.background.image
    } else {
      bgimglight = site.background.image.light
      bgimgdark = site.background.image.dark
      if (!bgimglight) {
        bgimglight = bgimgdark
      }
      if (!bgimgdark) {
        bgimgdark = bgimglight
      }
    }
  }
  const backgroundImage: StyleRecord = {
    key: 'bg-url',
    light: bgimglight ?? '',
    dark: bgimgdark ?? '',
    type: 'url'
  }

  const hoverTextRecord: StyleRecord = {
    key: 'hover-tab',
    light: '80 80 80',
    dark: '220 220 220',
    type: 'color'
  }

  return [colorRecord, backgroundRecord, backgroundImage, hoverTextRecord]
}

type StyleRecord = {
  key: string,
  light: string,
  dark: string
  type: 'color' | 'url'
}

const generateCSSVars = (records: StyleRecord[]) => {
  const toCSS = (records: StyleRecord[], light: boolean = true) => {
    return records.map((r: StyleRecord) => {
      let val = light ? r.light : r.dark;
      if (r.type == 'color') {
        const rgbValues = hexToRgb(val);
        val = rgbValues ? rgbValues.join(' ') : (light ? '255 255 255' : '0 0 0');
        return `--color-${r.key}: ${val};`
      } else {
        if (val == '') {
          return ''
        }
        return `--url-${r.key}: url("${val}");`
      }
    })
      .join('\n')
  }

  return `
    :root {
      ${toCSS(records)}
    }
    .dark-theme {
      ${toCSS(records, false)}
    }
  `
}

export function hexToRgb(hex: string): [number, number, number] | null {
  hex = hex.replace(/^#/, '')
  if (![3, 6].includes(hex.length)) return null

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }

  const bigint = parseInt(hex, 16)
  if (isNaN(bigint)) return null

  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  return [r, g, b]
}
