import { DecoratorNode } from 'lexical'
import * as React from 'react'
import { TableEditorComponent } from './EditableTable'

export class CustomTableNode extends DecoratorNode<JSX.Element> {
  __headers: string[]
  __rows: string[][]

  static getType(): string {
    return 'custom-table'
  }

  static clone(node: CustomTableNode) {
    return new CustomTableNode({
      headers: [...node.__headers],
      rows: node.__rows.map(r => [...r]),
    })
  }

  constructor({ headers, rows }: { headers: string[]; rows: string[][] }) {
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

  decorate(): JSX.Element {
    return <TableEditorComponent headers={this.__headers} rows={this.__rows} />
  }
}

