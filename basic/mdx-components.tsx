import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'
import { CheckItem, CheckList } from './components/doc-components/CheckList'
import { EditableWrapper } from './components/doc-components/edit-components/EditableWrapper'
import ApiReference from './components/doc-components/ApiReference'
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
  ApiReference,
  CheckList,
  CheckItem,
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})

