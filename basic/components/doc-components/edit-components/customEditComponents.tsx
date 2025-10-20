
import { jsxPlugin, NestedLexicalEditor } from '@mdxeditor/editor'
import { components } from '@/shared/mdx_components/components'

export const createDescriptorsFromComponents=() =>{
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
              getContent={(node) => node.children}
              getUpdatedMdastNode={(node, children) => ({
                ...node,
                children,
              })}
            />
          </Comp>
        </div>
      )
    },
  }))
}

// Helper para extraer los atributos del nodo MDX
function extractProps(mdastNode: any) {
  const props: Record<string, any> = {}
  for (const attr of mdastNode.attributes || []) {
    props[attr.name] = attr.value
  }
  return props
}



import { visit } from 'unist-util-visit'

export const  remarkCalloutPlugin=()=> {
  return (tree: any) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!node.children?.[0]?.children?.[0]?.value) return

      const firstLine = node.children[0].children[0].value.trim()

      const match = firstLine.match(/^\[!(\w+)\]/)
      if (!match) return

      const type = match[1].toLowerCase()

      node.children[0].children[0].value = node.children[0].children[0].value
        .replace(/^\[!\w+\]\s*/, '')

      const newNode = {
        type: 'mdxJsxFlowElement',
        name: 'AlertBlock',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'type', value: type },
        ],
        children: node.children,
      }

      parent.children[index] = newNode
    })
  }
}
