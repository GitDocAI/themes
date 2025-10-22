import { NestedLexicalEditor } from '@mdxeditor/editor'
import { components } from '@/shared/mdx_components/components'
import { TableEditPlugin } from './table/TableEditPlugin'
import { CardEditPlugin } from './card/CardEditPlugin'
import { ImageEditPlugin } from './image/ImageEditPlugin'
import { CollapseEditPlugin } from './collapse/CollapseEditPlugin'
import { alertBlockDirectives } from './alertblock/AlertBlockPlugin'


export const createDescriptorsFromComponents=(EditorContext:React.Context<any>) => {
  const directives = Object.entries(components).map(([name, Comp]) =>{
   switch(name){
      case 'DataTable':
       return TableEditPlugin(EditorContext)
      case 'DataTable':
       return TableEditPlugin(EditorContext)
      case 'Card':
       return CardEditPlugin(EditorContext)
      case 'img':
       return ImageEditPlugin(EditorContext)
      case 'Collapse':
       return CollapseEditPlugin()
      default:
       return   {
          name,
          kind: 'flow',
          hasChildren: true,
          Editor: ({ mdastNode }: any) => {
            return (
              <div contentEditable={false}>
                <Comp {...extractProps(mdastNode)}>
                  <NestedLexicalEditor
                    getContent={(node:any) => node.children}
                    getUpdatedMdastNode={(node, children) => ({
                      ...node,
                      children,
                    })}
                  />
                </Comp>
              </div>
            )
          },
        }

    }
  })

  return [...directives,...alertBlockDirectives]
}

function extractProps(mdastNode: any) {
  const props: Record<string, any> = {}
  if (mdastNode.attributes && Array.isArray(mdastNode.attributes)) {
    for (const attr of mdastNode.attributes) {
      if(attr.value?.type=="mdxJsxAttributeValueExpression"){
        props[attr.name] = JSON.parse(attr.value?.value)
        continue
      }
      // Boolean attributes (like paginator) have null value
      props[attr.name] = attr.value === null ? true : attr.value
    }
  }
  return props
}

