import React from 'react'
import { MDXEditorClient } from './MDXEditorClient'

const is_prod = process.env.NODE_ENV === 'production'
const enable_live_editor = process.env.NEXT_PUBLIC_ENABLE_LIVE_EDITOR === 'true'
const webhook_url = process.env.WEBHOOK_URL
const authentication = process.env.AUTHENTICATION

interface EditableWrapperProps {
  children: React.ReactNode
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  children,
}) => {
  // In production, just render the children (no editing)
  // Or if live editor is not explicitly enabled
  if (is_prod || !enable_live_editor) {
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
