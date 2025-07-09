import { getPageMap } from 'nextra/page-map'
import './global.css'
import { headers } from 'next/headers'
import DefaultLayout from '../components/themes/DefaultLayout.jsx'
import MintLayout from '../components/themes/Mint.tsx'
import { redirect } from 'next/navigation'
import CustomHead from '../components/CustomisableHead.jsx'

export const metadata = {

}

import site from '../site.json'

export default async function RootLayout({ children }) {


  const headersList = await headers()
  const currentPath = (headersList.get('x-current-path') || '/').split('/')[1];
  const pageMapV1 = await getPageMap()
  if (!site.versions.includes(currentPath)) {
    redirect(`/${site.defaultVersion}`)
  }

  let layout

  if (site[currentPath]) {
    switch (site[currentPath].theme) {
      case 'mint':
        layout = (
          <MintLayout
            children={children}
            pageMap={pageMapV1}
            site={site[currentPath]}
            versions={site.versions}
            defaultVersion={site.defaultVersion}
          />
        )
        break
      default:
        layout = (<DefaultLayout
          children={children}
          pageMap={pageMapV1}
          site={site[currentPath]}
          versions={site.versions}
          defaultVersion={site.defaultVersion}
        />)
    }

  } else {
    layout = (<DefaultLayout
      children={children}
      pageMap={pageMapV1}
      site={site[site.defaultVersion]}
      versions={site.versions}
      defaultVersion={site.defaultVersion}
    />)
  }
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <CustomHead
        colorscheme={site[currentPath]?.colors}
      >
      </CustomHead>
      <body>
        {layout}
      </body>
    </html>
  )
}
