
import { jsxPlugin, NestedLexicalEditor } from '@mdxeditor/editor'
import { components } from '@/shared/mdx_components/components'

export const createDescriptorsFromComponents=() => {
  return Object.entries(components).map(([name, Comp]) => ({
    name,
    kind: 'flow', // la mayoría de los tuyos son bloques, no inline
    hasChildren: true,
    // Editor es cómo el editor lo renderiza
    Editor: ({ mdastNode }: any) => {
      // Render estático (no editable) para la mayoría
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

// Helper para extraer los atributos del nodo MDX
function extractProps(mdastNode: any) {
  const props: Record<string, any> = {}
  for (const attr of mdastNode.attributes || []) {
    props[attr.name] = attr.value
  }
  return props
}

