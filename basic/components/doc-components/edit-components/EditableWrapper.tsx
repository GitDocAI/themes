import React from 'react'
import { EditableArticle } from './EditableArticle'

const is_prod = process.env.NODE_ENV == 'production'
const webhook_url = process.env.WEBHOOK_URL
const authentication = process.env.AUTHENTICATION

export const EditableWrapper = ({children,original_content}:{children:any,original_content?:string})=>{
  return is_prod ? (<>{children}</>) : (
    <EditableArticle
      is_prod={is_prod}
      webhook_url={webhook_url || ''}
      authentication={authentication || ''}>
      {children}
    </EditableArticle>
  )
}


