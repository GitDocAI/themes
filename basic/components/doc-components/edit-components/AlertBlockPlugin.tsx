'use client'

import React from 'react'
import {
  directivesPlugin,
  type DirectiveDescriptor,
} from '@mdxeditor/editor'
import { AlertBlock, type AlertType } from '../AlertBlock'

// Descriptor para cada tipo de AlertBlock
const createAlertDirective = (type: AlertType): DirectiveDescriptor => ({
  name: type,
  type: 'containerDirective',
  testNode: (node) => {
    return node.name === type
  },
  attributes: [],
  hasChildren: true,
  Editor: ({ mdastNode, lexicalNode, parentEditor }) => {
    return (
      <div contentEditable={false} style={{ margin: '16px 0' }}>
        <AlertBlock type={type}>
          <div
            contentEditable={true}
            suppressContentEditableWarning
            style={{ outline: 'none' }}
          >
            {/* El contenido editable se maneja por MDXEditor */}
          </div>
        </AlertBlock>
      </div>
    )
  },
})

// Crear directivas para todos los tipos de alert
export const alertBlockDirectives: DirectiveDescriptor[] = [
  createAlertDirective('tip'),
  createAlertDirective('note'),
  createAlertDirective('warning'),
  createAlertDirective('danger'),
  createAlertDirective('info'),
]

// Plugin configurado con todas las directivas
export const alertBlockPlugin = () =>
  directivesPlugin({
    directiveDescriptors: alertBlockDirectives,
  })
