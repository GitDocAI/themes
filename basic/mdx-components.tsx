import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'
import { CheckItem, CheckList } from './components/doc-components/CheckList'
import { EditableWrapper } from './components/doc-components/edit-components/EditableWrapper'
import ApiReference from './components/doc-components/ApiReference'
import {components as renderComponents} from './shared/mdx_components/components'
import { Info } from './components/doc-components/Info'
import { Tip } from './components/doc-components/Tip'
import { Note } from './components/doc-components/Note'
import { Warning } from './components/doc-components/Warning'
import { Danger } from './components/doc-components/Danger'
import { Collapse } from './components/doc-components/Collapse'

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
  Info,
  Tip,
  Note,
  Warning,
  Danger,
  Collapse,
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})

