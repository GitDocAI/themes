import { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode
}

export const CodeBlock = ({ children }: CodeBlockProps) => {
  const id = `code-`
  return (
    <span className="relative group inline-block w-full" >
      <code id={id} className="block p-3 bg-lupe-50 dark:bg-lupe-900/30 border border-lupe-200 dark:border-lupe-700/50 rounded-lg text-lupe-800 dark:text-lupe-100 font-mono text-sm">
        {children}
      </code>
      <button
        type="button"
        className="absolute cursor-pointer top-2 right-2 text-xs px-2 py-1 rounded-md text-lupe-600 dark:text-lupe-300 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/95 dark:bg-lupe-800/90 shadow-lg border border-lupe-300/80 dark:border-lupe-600/30 hover:border-accent-primary/60 hover:text-accent-primary hover:shadow-accent-primary/20 z-10"
        data-copy-target={id}
      >
        <i className="pi pi-clone"> </i>
      </button>
    </span >
  )
}

