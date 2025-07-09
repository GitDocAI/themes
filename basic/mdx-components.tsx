import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components'
import { TOC } from './components/toc'

const defaultComponents = getNextraComponents({
  wrapper({ children, toc }) {
    return (
      <>
        <div className="nextra-content" style={{ flexGrow: 1, padding: 20 }}>
          {children}
        </div>
        <TOC toc={toc} />
      </>
    )
  },
  h1: ({ children }) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-semibold mb-3 mt-8">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-semibold mb-2 mt-6">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
  code: ({ children }) => (
    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
      {children}
    </blockquote>
  ),
  img: ({ src, alt, height, ...props }) => (
    <img 
      src={src} 
      alt={alt} 
      className="rounded-lg mb-4 max-w-full" 
      style={{ height: height ? `${height}px` : 'auto' }}
      {...props} 
    />
  )
})

export const useMDXComponents = (components: any) => ({
  ...defaultComponents,
  ...components
})
