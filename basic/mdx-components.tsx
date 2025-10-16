import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'
import { CheckItem, CheckList } from './components/doc-components/CheckList'
import { EditableWrapper } from './components/doc-components/edit-components/EditableWrapper'
import ApiReference from './components/doc-components/ApiReference'
import {components as renderComponents} from './shared/mdx_components/components'
import React from 'react'


const editableTags = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'li', 'strong', 'em', 'del',
  // 'code', 'pre', 'blockquote', 'img',
  'table', 'th', 'td',
  // 'Tip', 'Note', 'Warning', 'Danger', 'Info'
])

function wrapWithEditable(tag: string, Component: any) {
  return function EditableComponent(props: any) {
    const { children, ...rest } = props
    let markdownSnippet = ''

    switch (tag) {
      case 'h1': markdownSnippet = `# ${children}`; break
      case 'h2': markdownSnippet = `## ${children}`; break
      case 'h3': markdownSnippet = `### ${children}`; break
      case 'h4': markdownSnippet = `#### ${children}`; break
      case 'h5': markdownSnippet = `##### ${children}`; break
      case 'h6': markdownSnippet = `###### ${children}`; break
      case 'p': markdownSnippet = `${children}`; break
      case 'li': markdownSnippet = `- ${children}`; break
      // case 'code': markdownSnippet = `\`${children}\``; break
      // case 'pre': markdownSnippet = `\`\`\`\n${children}\n\`\`\``; break
      // case 'blockquote': markdownSnippet = `> ${children}`; break
      case 'a': markdownSnippet = `[${props.children}](${props.href})`; break
      // case 'img': markdownSnippet = `![${props.alt}](${props.src})`; break
      // case 'Tip': markdownSnippet = `:::tip\n${children}\n:::`; break
      // case 'Note': markdownSnippet = `:::note\n${children}\n:::`; break
      // case 'Warning': markdownSnippet = `:::warning\n${children}\n:::`; break
      // case 'Danger': markdownSnippet = `:::danger\n${children}\n:::`; break
      // case 'Info': markdownSnippet = `:::info\n${children}\n:::`; break
      default: markdownSnippet = `${children}`
    }

    return (
      <EditableWrapper original_content={markdownSnippet}>
        <Component {...rest}>{children}</Component>
      </EditableWrapper>
    )
  }
}


const editableComponents = Object.fromEntries(
  Object.entries(renderComponents).map(([key, Comp]) => [
    key,
    editableTags.has(key) ? wrapWithEditable(key, Comp) : Comp
  ])
)



const defaultComponents = getNextraComponents({
  wrapper(content: any) {
    const { children, toc } = content
    return (
      <>
        <article id="mdx-content" className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
          {children}
        </article>
        <TOC toc={toc} />
        <div id="aside-root" className="[grid-area:toc]" />
      </>
    )
  },

  ...editableComponents as any,
  ApiReference,
  CheckList,
  CheckItem,
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})

