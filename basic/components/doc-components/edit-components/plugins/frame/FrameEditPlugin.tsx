'use client'
import { useContext, useState } from "react"
import { FrameInsertModal } from "./FrameInsertModal"
import { usePathname } from "next/navigation"
import { Frame } from "@/components/doc-components/Frame"

export const FrameEditPlugin = (EditorContext:React.Context<any>)=>{
      const EditableFrame = ({ mdastNode }: { mdastNode: any }) => {
        const [showEditModal, setShowEditModal] = useState(false)
        const context = useContext(EditorContext)
        const editorRef = context?.editorRef
        const saveToWebhook = context?.saveToWebhook
        const webhookUrl = context?.webhookUrl || ''
        const authentication = context?.authentication || ''
        const pathname = usePathname()

        const srcAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'src')
        const altAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'alt')
        const captionAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'caption')
        const widthAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'width')
        const heightAttr = (mdastNode.attributes as any[])?.find((attr) => attr.name === 'height')

        const src = srcAttr?.value || ''
        const alt = altAttr?.value || ''
        const caption = captionAttr?.value || ''
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

          return `../../../assets/${filename}`
        }

        const handleUpdate = async (newAlt: string, newCaption: string, newImagePath: string) => {
          if (!editorRef?.current || !saveToWebhook) return

          const currentMarkdown = editorRef.current.getMarkdown()

          // Build old frame markdown - try to match any format (with or without newlines)
          const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedAlt = alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedCaption = caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

          // Create a regex that matches the Frame with any whitespace/newline variations
          let regex = new RegExp(
            `<Frame[\\s\\n]+` +
            `src="${escapedSrc}"[\\s\\n]*` +
            `alt="${escapedAlt}"` +
            (caption ? `[\\s\\n]*caption="${escapedCaption}"` : '') +
            (width ? `[\\s\\n]*width="${width}"` : '') +
            (height ? `[\\s\\n]*height="${height}"` : '') +
            `[\\s\\n]*/>`,
            'g'
          )

          // Build new frame markdown (single line format for consistency)
          let newFrameMarkdown = `<Frame src="${newImagePath}" alt="${newAlt}"`
          if (newCaption) newFrameMarkdown += ` caption="${newCaption}"`
          if (width) newFrameMarkdown += ` width="${width}"`
          if (height) newFrameMarkdown += ` height="${height}"`
          newFrameMarkdown += ' />'

          // Replace in markdown
          const newMarkdown = currentMarkdown.replace(regex, newFrameMarkdown)

          editorRef.current.setMarkdown(newMarkdown)

          // Save to webhook
          await saveToWebhook(newMarkdown)
          setShowEditModal(false)
        }

        const handleDelete = async () => {
          if (!editorRef?.current || !saveToWebhook) return

          const currentMarkdown = editorRef.current.getMarkdown()

          // Build regex to match Frame with any whitespace/newline variations
          const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedAlt = alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedCaption = caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

          let regex = new RegExp(
            `<Frame[\\s\\n]+` +
            `src="${escapedSrc}"[\\s\\n]*` +
            `alt="${escapedAlt}"` +
            (caption ? `[\\s\\n]*caption="${escapedCaption}"` : '') +
            (width ? `[\\s\\n]*width="${width}"` : '') +
            (height ? `[\\s\\n]*height="${height}"` : '') +
            `[\\s\\n]*/>`,
            'g'
          )

          // Remove frame from markdown
          const newMarkdown = currentMarkdown.replace(regex, '')

          editorRef.current.setMarkdown(newMarkdown)

          // Save to webhook
          await saveToWebhook(newMarkdown)
        }

        return (
          <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <Frame
                src={src}
                alt={alt}
                caption={caption}
                width={width}
                height={height}
              />
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '8px',
                zIndex: 10,
              }}>
                <button
                  onClick={() => setShowEditModal(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                >
                  Delete
                </button>
              </div>
            </div>
            <FrameInsertModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onInsert={handleUpdate}
              onUpload={handleUpload}
              initialUrl={src}
              initialAlt={alt}
              initialCaption={caption}
            />
          </div>
        )
      }

      return{
                name: 'Frame',
                kind: 'text',
                props: [
                  { name: 'src', type: 'string' },
                  { name: 'alt', type: 'string' },
                  { name: 'caption', type: 'string' },
                  { name: 'width', type: 'string' },
                  { name: 'height', type: 'string' },
                ],
                hasChildren: false,
                Editor: ({ mdastNode }:any) => <EditableFrame mdastNode={mdastNode} />,
              }


}

