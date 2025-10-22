import { DecoratorNode } from 'lexical'
import * as React from 'react'
import { TableEditorComponent } from './EditableTable'

export class CustomTableNode extends DecoratorNode<React.ReactElement> {
  __headers: string[]
  __rows: Array<Record<string, string>>

  static getType(): string {
    return 'custom-table'
  }

  static clone(node: CustomTableNode) {
    return new CustomTableNode({
      headers: [...node.__headers],
      rows: node.__rows.map(r => ({ ...r })),
    })
  }

  constructor({ headers, rows }: { headers: string[]; rows: Array<Record<string, string>> }) {
    super()
    this.__headers = headers
    this.__rows = rows
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'custom-table-wrapper'
    return div
  }

  updateDOM(): false {
    return false
  }

  decorate(): React.ReactElement {
    return (
      <TableEditorComponent
        initialData={{ headers: this.__headers, rows: this.__rows }}
        onChange={() => {
          // TODO: Handle table changes
        }}
      />
    )
  }
}

