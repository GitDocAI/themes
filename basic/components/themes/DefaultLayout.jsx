import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import VersionSwitcher from '../VersionSwitcher.jsx'



export default async function DefaultLayout({ children, pageMap, site, versions, defaultVersion }) {


  const banner = (
    site?.banner ? <Banner>{site.banner}</Banner> : <span></span>
  )
  const navbar = (
    <Navbar
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
    <Layout
      navbar={navbar}
      banner={banner}
      pageMap={pageMap}
      docsRepositoryBase={site?.github}
      editLink={null}
      footer={footer}
    >
      {children}
    </Layout>

  )
}
