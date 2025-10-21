import { CustomTableNode } from './customTableNode'

export const customTableVisitor = {
  testNode: (node: any) => node.type === 'table',

  visitNode: (params: any) => {
    const { mdastNode, lexicalParent } = params

    try {
      const headerRow = mdastNode.children?.[0]
      const bodyRows = mdastNode.children?.slice(1) ?? []

      const headers =
        headerRow?.children?.map((h: any) => h.children?.[0]?.value ?? '') ?? []

      const rows = bodyRows.map((r: any) =>
        r.children.map((c: any) => c.children?.[0]?.value ?? '')
      )

      const tableNode = new CustomTableNode({ headers, rows })

      // ✅ insertamos directamente el nodo
      lexicalParent.append(tableNode)

      // 🚫 le decimos que no siga procesando hijos (tableRow, tableCell)
      return null
    } catch (err) {
      console.error('[CustomTableImportVisitor] Error:', err)
      return null
    }
  },
}

