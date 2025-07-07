import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'

const defaultComponents = getNextraComponents({
  wrapper({ children, toc }) {
    return (
      <>
        <div style={{ flexGrow: 1, padding: 20 }
        }> {children} </div>
        <TOC toc={toc} />
      </>
    )
  }
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})
