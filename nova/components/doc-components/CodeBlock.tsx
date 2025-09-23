import { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode
}

export const CodeBlock = ({ children }: CodeBlockProps) => {
  const id = `code-`
  return (
    <span className="relative group inline-block w-full" >
      <code id={id} className="block p-3 bg-nova-50 dark:bg-nova-900/30 border border-nova-200 dark:border-nova-700/50 rounded-lg text-nova-800 dark:text-nova-100 font-mono text-sm">
        {children}
      </code>
      <button
        type="button"
        className="absolute cursor-pointer top-2 right-2 text-xs px-2 py-1 rounded-md text-nova-600 dark:text-nova-300 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/95 dark:bg-nova-800/90 shadow-lg border border-nova-300/80 dark:border-nova-600/30 hover:border-accent-primary/60 hover:text-accent-primary hover:shadow-accent-primary/20 z-10"
        data-copy-target={id}
      >
        <i className="pi pi-clone"> </i>
      </button>
    </span >
  )
}

