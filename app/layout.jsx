import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import { Tabs } from 'nextra/components'

const tabs = (
  <Tabs items={['Pestaña 1', 'Pestaña 2']}>
    <Tabs.Tab>
      Contenido de la Pestaña 1
    </Tabs.Tab>
    <Tabs.Tab>
      Contenido de la Pestaña 2
    </Tabs.Tab>
  </Tabs>

)


export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
}


const navbar = (
  <Navbar
    logo={<b>dockitai</b>}
  />

)
const footer = <Footer>MIT {new Date().getFullYear()} © page.</Footer>

export default async function RootLayout({ children }) {
  const pageMapV1 = await getPageMap()
  const pageMapV2 = await getPageMap()
  console.log(pageMapV1)
  console.log(pageMapV2)
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
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
