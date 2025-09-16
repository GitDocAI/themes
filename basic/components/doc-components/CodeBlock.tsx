import { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode
}

export const CodeBlock = ({ children }: CodeBlockProps) => {
  const id = `code-`
  return (
    <span className="relative group" >
      <code id={id}>
        {children}
      </code>
      <button
        type="button"
        className="absolute cursor-pointer -top-2 -right-4 text-xs px-3 py-1 rounded-md  text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        data-copy-target={id}
      >
        <i className="pi pi-clone"> </i>
      </button>
    </span >
  )
}

