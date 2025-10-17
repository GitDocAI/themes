import React from 'react'
import { EditableArticle } from './EditableArticle'
import DevToolbar from './DevToolbar'

const is_prod = process.env.NODE_ENV == 'production'
const webhook_url = process.env.WEBHOOK_URL
const authentication = process.env.AUTHENTICATION

export const EditableWrapper = ({children,original_content}:{children:any,original_content?:string})=>{
  if (is_prod) {
    return <>{children}</>
  }

  return (
    <div className="[grid-area:content] sm:p-3 h-full flex-1 min-h-[60dvh]">
      <DevToolbar />
      <EditableArticle
        is_prod={is_prod}
        webhook_url={webhook_url || ''}
        authentication={authentication || ''}>
        {children}
      </EditableArticle>
    </div>
  )
}


