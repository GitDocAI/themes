import type { Metadata } from 'next'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import type { FC, ReactNode } from 'react'
import { DefaultTheme } from '../components/default-theme'
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './global.css'
import { ThemeInfo } from '../models/ThemeInfo'
import InvalidConfigPage from '@/components/InvalidConfig'
import { GlobalScript } from '@/components/doc-components/GlobalScript'
import { PrimeReactProvider } from "primereact/api";
import { ImageWrapper } from '@/components/ImageWrapper'

import { openapi_path_builder } from '../shared/path_builder';

export const metadata: Metadata = {
  title: {
    absolute: '',
    template: '%s'
  }
}



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
         <PrimeReactProvider value={createPrimeReactTheme()} >
          <DefaultTheme themeinfo={site as any} pageMap={pageMap} >{children}</DefaultTheme>
         </PrimeReactProvider>
        <GlobalScript />
        <ImageWrapper />
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


const createPrimeReactTheme = () => {
  return {
    ripple: true,
    pt: {
      button: {
        root: {
          className: {
            default: `bg-primary text-white border-none hover:opacity-90`
          }
        }
      },
      datatable: {
              root: {
                className: `!rounded-lg !overflow-hidden !border !border-secondary/15`
              },
              table: {
                className: '!w-full'
              },
              thead: {
                className: '!bg-primary/10'
              },
              headerRow: {
                className: '!border-b-2 !border-primary/30'
              },
              headerCell: {
                className: '!py-3 !px-4 !text-left !font-bold !text-primary !bg-primary/5 !border-r !border-primary/20 last:!border-r-0'
              },
              tbody: {
                className: '!bg-background'
              },
              bodyRow: {
                className: '!border-b !border-primary/15 hover:!bg-primary/5 !transition-colors'
              },
              cell: {
                className: '!py-3 !px-4 !border-r !border-primary/18 last:!border-r-0'
              }
      },
      column: {
        filterOverlay: {
          className: '!bg-[rgb(var(--color-bg))] !border !border-secondary/20 !rounded-md !shadow-xl !p-4'
        },
        filterInput: {
          className: '!w-full !px-3 !py-2 !border !border-secondary/20 !rounded-md !bg-[rgb(var(--color-bg))] !text-secondary'
        },
        filterMenuButton: {
          className: '!text-primary hover:!bg-primary/10'
        },
        columnFilter: {
          className: '!bg-[rgb(var(--color-bg))]'
        },
        filterOperator: {
          className: '!bg-[rgb(var(--color-bg))] !mb-3'
        },
        filterConstraints: {
          className: '!space-y-2'
        },
        filterConstraint: {
          className: '!border-b !border-secondary/15 last:!border-b-0 !pb-2 !mb-2'
        },
        filterMatchModeDropdown: {
          root: {
            className: '!bg-[rgb(var(--color-bg))] !border !border-secondary/20 !text-secondary !rounded-md'
          }
        },
        filterOperatorDropdown: {
          root: {
            className: '!bg-[rgb(var(--color-bg))] !border !border-secondary/20 !text-secondary !rounded-md'
          }
        },
        filterAddRule: {
          className: '!text-primary hover:!bg-primary/10 !mt-2'
        },
        filterRemoveButton: {
          root: {
            className: '!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20'
          }
        },
        filterButtonbar: {
          className: '!flex !justify-end !gap-2 !pt-4 !mt-4 !border-t !border-secondary/15'
        },
        filterClearButton: {
          root: {
            className: '!bg-secondary/10 !text-secondary hover:!bg-secondary/20 !border-none'
          }
        },
        filterApplyButton: {
          root: {
            className: '!bg-primary !text-white hover:!bg-primary/90 !border-none'
          }
        }
      },
      inputtext: {
        root: {
          className: '!px-3 !py-2 !border !border-secondary/20 !rounded-md !bg-[rgb(var(--color-bg))] !text-secondary placeholder:!text-secondary/60 focus:!ring-2 focus:!ring-primary focus:!border-transparent'
        }
      },
      dropdown: {
        root: {
          className: '!bg-[rgb(var(--color-bg))] !border !border-secondary/20 !text-secondary !rounded-md'
        },
        input: {
          className: '!bg-transparent !text-secondary'
        },
        trigger: {
          className: '!text-secondary/70'
        },
        panel: {
          className: '!bg-[rgb(var(--color-bg))] !border !border-secondary/20 !shadow-lg !rounded-md'
        },
        item: {
          className: '!text-secondary hover:!bg-primary/10 !px-3 !py-2'
        }
      }
    }
  }
}



