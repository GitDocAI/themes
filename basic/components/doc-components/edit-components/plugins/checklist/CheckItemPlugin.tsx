'use client'

import { NestedLexicalEditor } from '@mdxeditor/editor'
import React, { useContext, useState } from 'react'
import clsx from 'clsx'

export const CheckItemEditPlugin = (EditorContext: React.Context<any>) => {
  return {
    name: 'CheckItem',
    kind: 'flow',
    props: [
      { name: 'variant', type: 'string' },
    ],
    hasChildren: true,
    Editor: ({ mdastNode, ...editor }: any) => {
      const Wrapper = ({children}:any) => {
        const context = useContext(EditorContext)
        const editorRef = context?.editorRef
        const saveToWebhook = context?.saveToWebhook

        const initialVariant =
          mdastNode.attributes?.find((a: any) => a.name === 'variant')?.value || 'do'

        const [variant, setVariant] = useState(initialVariant)
        const [isHovering, setIsHovering] = useState(false)

        const toggleVariant = async () => {
          const newVariant = variant === 'do' ? 'dont' : 'do'
          setVariant(newVariant)

          if (!editorRef?.current) return

          const currentMarkdown = editorRef.current.getMarkdown()
          const lines = currentMarkdown.split('\n')

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('<CheckItem') && lines[i].includes(`variant="${variant}"`)) {
              lines[i] = lines[i].replace(
                /variant="(do|dont)"/,
                `variant="${newVariant}"`
              )
              break
            }
          }

          const updated = lines.join('\n')
          editorRef.current.setMarkdown(updated)
          if (saveToWebhook) await saveToWebhook(updated)
        }

        return (
          <div
            className={clsx(
              'flex items-start gap-3 transition-all py-1 rounded',
              variant === 'do' ? 'text-primary' : 'text-secondary'
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Toggle button */}
            <button
              onClick={toggleVariant}
              className={clsx(
                'mt-1 text-lg transition-opacity',
                variant === 'do' ? 'text-primary' : 'text-secondary/70',
                isHovering && 'opacity-80'
              )}
              title="Cambiar tipo"
            >
              <i className={variant === 'do' ? 'pi pi-check-square' : 'pi pi-stop'} />
            </button>

              <div
                contentEditable={true}
                suppressContentEditableWarning
                style={{ outline: 'none' }}
              >
                  <NestedLexicalEditor
                    getContent={(node:any) => node.children}
                    getUpdatedMdastNode={(node, children) => ({
                      ...node,
                      children,
                    })}
                  />
              </div>
          </div>
        )
      }

      return <Wrapper />
    },
  }
}

