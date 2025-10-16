
import {EditableComponent} from './EditableComponent'


const is_prod = process.env.NODE_ENV == 'production'
const webhook_url = process.env.WEBHOOK_URL
const authentication = process.env.AUTHENTICATION


export const EditableWrapper = ({children,original_content}:{children:any,original_content?:string})=>{

  return is_prod? (<>{children}</>):(<EditableComponent
    original_content={original_content}
    webhook_url={webhook_url!}
    authentication={authentication!}>
  </EditableComponent>)
}

