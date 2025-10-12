import { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode
}

export const CodeBlock = ({ children }: CodeBlockProps) => {
  const id = `code-`
  return (
    <span className="relative group " >
      <code id={id}>
        {children}
      </code>
      <button
        type="button"
        className="absolute cursor-pointer top-1 right-1 text-xs px-1.5 py-0.5 rounded text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-gray-700/90 shadow-sm z-10"
        data-copy-target={id}
      >
        <i className="pi pi-clone"> </i>
      </button>
    </span >
  )
}

