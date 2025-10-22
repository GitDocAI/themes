// src/plugins/LexicalTableVisitor.ts
import { $isCustomTableNode } from './typeguards'

export function customTableToMarkdown(editor: any, markdownWriter: any) {
  editor.getEditorState().read(() => {
    const root = editor.getRootElement()
    if (!root) return
    const tables = root.querySelectorAll('.custom-table-wrapper')
    tables.forEach(() => {
      // handled via node exportJSON
    })
  })
}

export function tableDataToMarkdown({ headers, rows }: { headers: string[]; rows: any[] }) {
  const headerLine = `| ${headers.join(' | ')} |`
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`
  const rowLines = rows.map(
    (r) => `| ${headers.map((h) => (r[h] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`
  )
  return [headerLine, sepLine, ...rowLines].join('\n')
}

export const CustomTableExportVisitor = {
  testLexicalNode: (node: any) => $isCustomTableNode(node),
  visitLexicalNode: (node: any, mdastBuilder: any) => {
    const data = node.getData()
    const value = tableDataToMarkdown(data)
    mdastBuilder.addMarkdown(value)
  }
}

