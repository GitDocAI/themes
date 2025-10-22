
import { NestedLexicalEditor } from '@mdxeditor/editor'
import { components } from '@/shared/mdx_components/components'

export const createDescriptorsFromComponents=() => {
  return Object.entries(components).map(([name, Comp]) => ({
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
  })) as any
}

function extractProps(mdastNode: any) {
  const props: Record<string, any> = {}
  if (mdastNode.attributes && Array.isArray(mdastNode.attributes)) {
    for (const attr of mdastNode.attributes) {
      if(attr.value?.type=="mdxJsxAttributeValueExpression"){
        console.log(attr.value.value)
        props[attr.name] = JSON.parse(attr.value?.value)
        continue
      }
      // Boolean attributes (like paginator) have null value
      props[attr.name] = attr.value === null ? true : attr.value
    }
  }
  return props
}

