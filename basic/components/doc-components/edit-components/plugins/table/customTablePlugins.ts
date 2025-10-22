// src/plugins/customTablePlugin.ts
import { realmPlugin } from '@mdxeditor/editor'
import { addImportVisitor$,addExportVisitor$ } from '@mdxeditor/editor'
import { addLexicalNode$ } from '@mdxeditor/editor'
import { CustomTableNode } from './customTableNode'
import { customTableVisitor } from './mdAstTableVisitor'
import { CustomTableExportVisitor } from './lexicalTableVisitor'
// (y también addExportVisitor$ si quieres exportar)

export const customTablePlugin = realmPlugin({
  init(realm) {
    realm.pub(addLexicalNode$, CustomTableNode)
    realm.pub(addImportVisitor$, customTableVisitor)
    realm.pub(addExportVisitor$, CustomTableExportVisitor)
    // opcional
  },
})

