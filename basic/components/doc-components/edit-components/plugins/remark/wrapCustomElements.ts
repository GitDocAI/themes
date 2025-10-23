import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import { visit } from 'unist-util-visit'

function wrapTablesAndAdmonitionsPlugin() {
  return (tree: any) => {
    visit(tree, 'table', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return

      const prevNode = parent.children[index - 1]
      if (prevNode?.type === 'mdxJsxFlowElement' || parent.type === 'mdxJsxFlowElement') {
        return
      }

      const dataTableNode = {
        type: 'mdxJsxFlowElement',
        name: 'DataTable',
        attributes: [],
        children: [node],
      }

      parent.children[index] = dataTableNode
    })



    //[!TIP], [!NOTE], [!WARNING], [!INFO]
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return
      if (!node.children?.length) return

      const firstChild = node.children[0]
      if (firstChild.type !== 'text') return

      const match = firstChild.value.match(/^\[!(TIP|NOTE|WARNING|INFO)\]/i)
      if (!match) return

      const level = match[1].toUpperCase()
      const componentName = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()

      const followingNodes = []
      let i = index + 1
      while (i < parent.children.length) {
        const next = parent.children[i]
        if (next.type === 'paragraph' && /^\[!/.test(next.children?.[0]?.value || '')) break
        followingNodes.push(next)
        i++
      }

      const admonitionNode = {
        type: 'mdxJsxFlowElement',
        name: componentName, // Ej: Tip, Warning, Info, Note
        attributes: [],
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: firstChild.value.replace(/^\[!(TIP|NOTE|WARNING|INFO)\]\s*/i, ''),
              },
              ...node.children.slice(1),
            ],
          },
          ...followingNodes,
        ],
      }

      parent.children.splice(index, 1 + followingNodes.length, admonitionNode)
    })

    //remove blockquote if it has a AlertBlock Inside
    visit(tree, 'blockquote', (node, index, parent) => {
      if(node.children[0].type!='mdxJsxFlowElement') return
      const children = node.children
      parent.children.splice(index,1,...children)
    })



  }
}

export async function wrapCustomElements(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(wrapTablesAndAdmonitionsPlugin)
    .use(remarkStringify, {
      fences: true,
      bullet: '-',
    })
    .process(markdown)

  return String(file)
}

