import Collapse from '@/components/doc-components/Collapse'
import {
  NestedLexicalEditor,
} from '@mdxeditor/editor'
import type { MdxJsxTextElement } from 'mdast-util-mdx'
export const CollapseEditPlugin =()=>{
  return {
    name: 'Collapse',
    kind: 'flow',
    props: [
      { name: 'title', type: 'string' },
      { name: 'defaultOpen', type: 'string' },
    ],
    hasChildren: true,
    Editor: ({ mdastNode }:any) => {
      const titleAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'title')
      const defaultOpenAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'defaultOpen')
      const title = titleAttr?.value || 'Details'
      const defaultOpen = defaultOpenAttr?.value === 'true'
      return (
        <div contentEditable={false} style={{ margin: '16px 0' }}>
          <Collapse title={title} defaultOpen={true}>
            <NestedLexicalEditor<MdxJsxTextElement>
              getContent={(node) => node.children}
              getUpdatedMdastNode={(node, children) => ({ ...node, children: children as any })}
            />
          </Collapse>
        </div>
      )
    },
  }
}
