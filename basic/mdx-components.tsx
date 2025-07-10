import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'
import { AlertBlock } from './components/doc-components/AlertBlock'
import { CodeBlock } from './components/doc-components/CodeBlock'

const defaultComponents = getNextraComponents({
  wrapper({ children, toc }) {
    return (
      <>
        <div className="nextra-content flex-grow px-6 py-4">
          {children}
        </div>
        <TOC toc={toc} />
      </>
    )
  },

  // Títulos
  h1: ({ children }) => <h1 className="text-4xl font-bold mb-6">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-semibold mb-5 mt-10">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-medium mb-3 mt-8">{children}</h3>,

  // Párrafos y listas
  p: ({ children }) => <p className="mb-4 leading-7 text-base text-primary">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ children }) => (
    <CodeBlock>
      {children}
    </CodeBlock>
  ),
  pre: ({ children }) => (
    <pre className="bg-secondary/20 text-sm p-4 rounded-lg overflow-x-auto mb-2 border border-neutral-200 dark:border-neutral-700 ">
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-secondary mb-4">
      {children}
    </blockquote>
  ),

  // Imágenes
  img: ({ src, alt, height, ...props }) => (
    <img
      src={src as string}
      alt={alt}
      className="rounded-lg mb-4 max-w-full"
      style={{ height: height ? `${height}px` : 'auto' }}
      {...props}
    />
  ),

  // Tablas
  table: ({ children }) => (
    <table className="w-full border border-secondary/20 text-left rounded-md overflow-hidden mb-6">
      {children}
    </table>
  ),
  thead: ({ children }) => (
    <thead className="bg-secondary/10 dark:bg-secondary/20 text-primary font-semibold">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-secondary/10">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-secondary/5 transition">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-sm border-b border-secondary/20">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-sm border-b border-secondary/10">{children}</td>
  ),

  // Custom MDX blocks
  Tip: ({ children }) => (
    <AlertBlock type="tip">
      {children}
    </AlertBlock>
  ),
  Note: ({ children }) => (
    <AlertBlock type="note">
      {children}
    </AlertBlock>
  ),
  Warning: ({ children }) => (
    <AlertBlock type="warning">
      {children}
    </AlertBlock>
  ),
  Danger: ({ children }) => (
    <AlertBlock type="danger">
      {children}
    </AlertBlock>
  ),
  Info: ({ children }) => (
    <AlertBlock type="info">
      {children}
    </AlertBlock>
  ),
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})
