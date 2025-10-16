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
  'th', 'td', // Table cells
  // 'code', 'pre', 'blockquote', 'img',
  // 'Tip', 'Note', 'Warning', 'Danger', 'Info'
])

// Helper function to extract text from React children
function extractText(children: any): string {
  if (typeof children === 'string') {
    return children
  }
  if (typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join('')
  }
  if (React.isValidElement(children) && children.props) {
    return extractText((children.props as any).children)
  }
  return ''
}

function wrapWithEditable(tag: string, Component: any) {
  return function EditableComponent(props: any) {
    const { children, ...rest } = props
    const textContent = extractText(children)
    let markdownSnippet = ''

    switch (tag) {
      case 'h1': markdownSnippet = `# ${textContent}`; break
      case 'h2': markdownSnippet = `## ${textContent}`; break
      case 'h3': markdownSnippet = `### ${textContent}`; break
      case 'h4': markdownSnippet = `#### ${textContent}`; break
      case 'h5': markdownSnippet = `##### ${textContent}`; break
      case 'h6': markdownSnippet = `###### ${textContent}`; break
      case 'p': markdownSnippet = textContent; break
      case 'li': markdownSnippet = `- ${textContent}`; break
      case 'strong': markdownSnippet = `**${textContent}**`; break
      case 'em': markdownSnippet = `*${textContent}*`; break
      case 'del': markdownSnippet = `~~${textContent}~~`; break
      // case 'code': markdownSnippet = `\`${textContent}\``; break
      // case 'pre': markdownSnippet = `\`\`\`\n${textContent}\n\`\`\``; break
      // case 'blockquote': markdownSnippet = `> ${textContent}`; break
      case 'a': markdownSnippet = `[${extractText(props.children)}](${props.href})`; break
      // case 'img': markdownSnippet = `![${props.alt}](${props.src})`; break
      // case 'Tip': markdownSnippet = `:::tip\n${textContent}\n:::`; break
      // case 'Note': markdownSnippet = `:::note\n${textContent}\n:::`; break
      // case 'Warning': markdownSnippet = `:::warning\n${textContent}\n:::`; break
      // case 'Danger': markdownSnippet = `:::danger\n${textContent}\n:::`; break
      // case 'Info': markdownSnippet = `:::info\n${textContent}\n:::`; break
      default: markdownSnippet = textContent
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

