import { Footer, Layout } from 'nextra-theme-docs'
import { Banner } from 'nextra/components'
import VersionSwitcher from '../VersionSwitcher.jsx'
import { Navbar as NavBarMint } from '@/components/mint/Navbar'
import { Sidebar } from '../mint/Sidebar'



export default async function MintLayout({ children, pageMap, site, versions, defaultVersion }: any) {


  const banner = (
    site?.banner ? <Banner>{site.banner}</Banner> : <span></span>
  )
  const navbar = (
    <NavBarMint
      pageMap={pageMap}
      logo={
        <div className="flex flex-row items-center gap-3" >
          <img className="w-5 h-5" src={site?.logo} alt="" />
          <b > {site?.name} </b>
          <VersionSwitcher versions={versions} defaultVersion={defaultVersion} />
        </div>
      }
    />

  )
  const footer = <Footer>MIT {new Date().getFullYear()} © page.</Footer>

  return (
    <main className="flex flex-row gap-1">
      <div className='flex flex-col w-full'>
        <Layout
          themeSwitch={{
            dark: 'Темный',
            light: 'Светлый',
            system: 'Системный'
          }}
          navbar={navbar}
          banner={banner}
          pageMap={pageMap}
          docsRepositoryBase={site?.github}
          editLink={null}
          footer={footer}
        >
          {children}
        </Layout>
      </div>
      <Sidebar pageMap={pageMap} />
    </main>

  )
}
