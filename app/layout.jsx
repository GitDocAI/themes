import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import './global.css'
import site from "../site.config"
import VersionSwitcher from '../components/VersionSwitcher.jsx'

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
}


const navbar = (
  <Navbar
    logo={
      <div className="flex flex-row items-center gap-3" >
        <img className="w-5 h-5" src={site.logo} alt="" />
        <b > {site.name} </b>
        <VersionSwitcher versions={site.versions} defaultVersion={site.defaultVersion} />
      </div>
    }
  />

)
const footer = <Footer>MIT {new Date().getFullYear()} © page.</Footer>

export default async function RootLayout({ children }) {
  const pageMapV1 = await getPageMap()
  return (
    <html
      // Not required, but good for SEO
      lang="en"
      // Required to be set
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
    >
      <Head
      >
        {/* Your additional tags should be passed as `children` of `<Head>` element */}
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={pageMapV1}
          docsRepositoryBase={site.github}
          editLink={null}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
