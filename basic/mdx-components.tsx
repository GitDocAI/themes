import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'
import { EditableWrapper } from './components/doc-components/edit-components/EditableWrapper'
import {components as renderComponents} from './shared/mdx_components/components'

const defaultComponents = getNextraComponents({
  wrapper(content: any) {
    const { children, toc } = content
    return (
      <>
        <EditableWrapper>
          {children}
        </EditableWrapper>
        <TOC toc={toc} />
        <div id="aside-root" className="[grid-area:toc]" />
      </>
    )
  },

  ...renderComponents as any,
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})

