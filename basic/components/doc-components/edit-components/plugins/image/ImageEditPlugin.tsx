'use client'
import { useContext, useState } from "react"
import { ImageEditModal } from "./ImageEditModal"
import { usePathname } from "next/navigation"

export const ImageEditPlugin = (EditorContext:React.Context<any>)=>{
      const EditableImage = ({ mdastNode }: { mdastNode: any }) => {
        const [showEditModal, setShowEditModal] = useState(false)
        const context = useContext(EditorContext)
        const editorRef = context?.editorRef
        const saveToWebhook = context?.saveToWebhook
        const webhookUrl = context?.webhookUrl || ''
        const authentication = context?.authentication || ''
        const pathname = usePathname()

        const srcAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'src')
        const altAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'alt')
        const widthAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'width')
        const heightAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'height')

        const src = srcAttr?.value || ''
        const alt = altAttr?.value || ''
        const width = widthAttr?.value
        const height = heightAttr?.value

        const handleUpload = async (file: File): Promise<string> => {
          const formData = new FormData()
          const timestamp = Date.now()
          const extension = file.name.split('.').pop()
          const filename = `screenshot_${timestamp}.${extension}`
          const assetPath = `${pathname.replace(/^\//, '')}/assets/${filename}`

          formData.append('file', file, filename)
          formData.append('file_path', assetPath)
          formData.append('is_multipart', 'true')

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              ...(authentication && { Authorization: authentication }),
            },
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Failed to upload image')
          }

          return `./assets/${filename}`
        }

        const handleUpdate = async (newAlt: string, newImagePath?: string) => {
          if (!editorRef?.current || !saveToWebhook) return

          const currentMarkdown = editorRef.current.getMarkdown()

          // Build old image markdown
          let oldImageMarkdown = '<img'
          if (src) oldImageMarkdown += `\n  src="${src}"`
          if (alt) oldImageMarkdown += `\n  alt="${alt}"`
          if (width) oldImageMarkdown += `\n  width="${width}"`
          if (height) oldImageMarkdown += `\n  height="${height}"`
          oldImageMarkdown += '\n/>'

          // Build new image markdown
          let newImageMarkdown = '<img'
          newImageMarkdown += `\n  src="${newImagePath || src}"`
          newImageMarkdown += `\n  alt="${newAlt}"`
          if (width) newImageMarkdown += `\n  width="${width}"`
          if (height) newImageMarkdown += `\n  height="${height}"`
          newImageMarkdown += '\n/>'

          // Replace in markdown
          const newMarkdown = currentMarkdown.replace(oldImageMarkdown, newImageMarkdown)
          editorRef.current.setMarkdown(newMarkdown)

          // Save to webhook
          await saveToWebhook(newMarkdown)
        }

        return (
          <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              Edit
            </button>
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700"
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
            {alt && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
                {alt}
              </p>
            )}
            <ImageEditModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onUpdate={handleUpdate}
              onUpload={handleUpload}
              currentSrc={src}
              currentAlt={alt}
            />
          </div>
        )
      }

      return{
                name: 'img',
                kind: 'text',
                props: [
                  { name: 'src', type: 'string' },
                  { name: 'alt', type: 'string' },
                  { name: 'width', type: 'string' },
                  { name: 'height', type: 'string' },
                ],
                hasChildren: false,
                Editor: ({ mdastNode }:any) => <EditableImage mdastNode={mdastNode} />,
              }


}


