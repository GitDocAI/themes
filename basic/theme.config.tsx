import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>DockitAI</span>,
  project: {
    link: 'https://github.com/dockitai/dockitai',
  },
  docsRepositoryBase: 'https://github.com/dockitai/dockitai',
  footer: {
    text: 'DockitAI Documentation',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – DockitAI'
    }
  }
}

export default config