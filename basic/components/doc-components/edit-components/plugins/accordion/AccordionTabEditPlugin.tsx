import { NestedLexicalEditor } from '@mdxeditor/editor'
import { AccordionTab } from 'primereact/accordion'

export const AccordionTabEditPlugin = () => {
  return {
    name: 'AccordionTab',
    kind: 'flow',
    hasChildren: true,
    props: [
      { name: 'header', type: 'string' },
    ],
    Editor: ({ mdastNode }: any) => {
      // Extract props from mdastNode attributes
      const extractProps = (node: any) => {
        const props: Record<string, any> = {}
        if (node.attributes && Array.isArray(node.attributes)) {
          for (const attr of node.attributes) {
            if (attr.value?.type === "mdxJsxAttributeValueExpression") {
              try {
                props[attr.name] = JSON.parse(attr.value?.value)
              } catch {
                props[attr.name] = attr.value?.value
              }
            } else {
              props[attr.name] = attr.value === null ? true : attr.value
            }
          }
        }
        return props
      }

      const tabProps = extractProps(mdastNode)
      const header = tabProps.header || 'Accordion Tab'

      return (
        <AccordionTab header={header} {...tabProps}>
          <NestedLexicalEditor
            getContent={(node: any) => node.children}
            getUpdatedMdastNode={(node, children) => ({
              ...node,
              children,
            })}
          />
        </AccordionTab>
      )
    },
  }
}
