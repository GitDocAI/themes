import React from 'react'
import { MDXEditorClient } from './MDXEditorClient'

const is_prod = process.env.NODE_ENV === 'production'
const webhook_url = process.env.WEBHOOK_URL
const authentication = process.env.AUTHENTICATION

interface EditableWrapperProps {
  children: React.ReactNode
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  children,
}) => {
  // In production, just render the children (no editing)
  if (is_prod) {
    return (<div className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
      {children}
    </div>)
  }

  return (
    <div className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
      <MDXEditorClient
        webhookUrl={webhook_url || ''}
        authentication={authentication || ''}
      />
    </div>
  )
}
