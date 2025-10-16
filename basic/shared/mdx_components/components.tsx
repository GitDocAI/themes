import React from 'react'
import { AlertBlock } from '../../components/doc-components/AlertBlock'
import { BlockQuote } from '../../components/doc-components/BlockQuote'
import { CodeBlock } from '../../components/doc-components/CodeBlock'
import { CheckItem, CheckList } from '../../components/doc-components/CheckList'
import { EditableWrapper } from '../../components/doc-components/edit-components/EditableWrapper'
import ApiReference from '../../components/doc-components/ApiReference'

export const components = {
  // --- Headings ---
  h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-10">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-semibold mb-5 mt-10">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-medium mb-4 mt-8">{children}</h3>,
  h4: ({ children }) => <h4 className="text-xl font-medium mb-3 mt-6">{children}</h4>,
  h5: ({ children }) => <h5 className="text-lg font-semibold mb-2 mt-5">{children}</h5>,
  h6: ({ children }) => <h6 className="text-base font-semibold mb-1 mt-4 text-secondary">{children}</h6>,

  // --- Text blocks ---
  p: ({ children }) => <p className="mb-4 leading-7 text-base text-secondary">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic text-secondary">{children}</em>,
  del: ({ children }) => <del className="text-secondary/60 line-through">{children}</del>,
  hr: () => <hr className="my-8 border-t border-secondary/20" />,

  // --- Inline code ---
  code: ({ inline, children, ...props }) => {
    if (inline) {
      return (
        <code className="bg-secondary/10 text-sm px-1.5 py-0.5 rounded font-mono text-primary/90">
          {children}
        </code>
      )
    }
    return <CodeBlock {...props}>{children}</CodeBlock>
  },

  // --- Code block wrapper ---
  pre: ({ children }) => (
    <pre className="bg-secondary/20 text-sm p-4 rounded-lg overflow-x-auto mb-4 border border-neutral-200 dark:border-neutral-700">
      {children}
    </pre>
  ),

  // --- Lists ---
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }) => {
    const childrenArray = React.Children.toArray(children).filter((ch: any) => ch.props?.type === 'checkbox')
    if (childrenArray.length > 0) {
      const inner = React.Children.toArray(children).filter((ch: any) => ch.props?.type !== 'checkbox')
      return (
        <CheckItem variant={(childrenArray[0] as any)?.props?.checked ? 'do' : 'dont'}>
          {inner}
        </CheckItem>
      )
    }
    return <li className="mb-1">{children}</li>
  },
  CheckList,
  CheckItem,

  // --- Links & media ---
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 transition"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, height, ...props }) => (
    <img
      src={src as string}
      alt={alt}
      className="rounded-lg mb-4 max-w-full border border-neutral-200 dark:border-neutral-700"
      style={{ height: height ? `${height}px` : 'auto' }}
      {...props}
    />
  ),

  // --- Blockquote ---
  blockquote: ({ children }) => <BlockQuote>{children}</BlockQuote>,

  // --- Tables ---
  table: ({ children }) => (
    <table className="w-full border border-secondary/20 text-left rounded-md overflow-hidden mb-6">
      {children}
    </table>
  ),
  thead: ({ children }) => (
    <thead className="bg-secondary/10 dark:bg-secondary/20 text-primary font-semibold">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-secondary/10">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-secondary/5 transition">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 text-sm border-b border-secondary/20">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-sm border-b border-secondary/10">{children}</td>,

  // --- Misc / MDX custom blocks ---
  Tip: ({ children }) => <AlertBlock type="tip">{children}</AlertBlock>,
  Note: ({ children }) => (
    <EditableWrapper original_content={`:::note\n${children}\n:::`}>
      <AlertBlock type="note">{children}</AlertBlock>
    </EditableWrapper>
  ),
  Warning: ({ children }) => (
    <EditableWrapper original_content={`:::warning\n${children}\n:::`}>
      <AlertBlock type="warning">{children}</AlertBlock>
    </EditableWrapper>
  ),
  Danger: ({ children }) => (
    <EditableWrapper original_content={`:::danger\n${children}\n:::`}>
      <AlertBlock type="danger">{children}</AlertBlock>
    </EditableWrapper>
  ),
  Info: ({ children }) => (
    <EditableWrapper original_content={`:::info\n${children}\n:::`}>
      <AlertBlock type="info">{children}</AlertBlock>
    </EditableWrapper>
  ),

  // --- Special Markdown features ---
  inlineCode: ({ children }) => (
    <code className="bg-secondary/10 text-sm px-1 rounded font-mono text-primary/90">{children}</code>
  ),
  br: () => <br />,

  // --- MDX Components ---
  ApiReference,
}
