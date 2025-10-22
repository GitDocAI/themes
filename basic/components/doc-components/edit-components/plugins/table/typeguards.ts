// src/plugins/typeguards.ts
import { LexicalNode } from 'lexical'
import { CustomTableNode } from './customTableNode'

export function $isCustomTableNode(node?: LexicalNode | null): node is CustomTableNode {
  return node instanceof CustomTableNode
}
