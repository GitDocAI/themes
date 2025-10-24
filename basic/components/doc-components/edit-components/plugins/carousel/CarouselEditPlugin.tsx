'use client'
import { useContext, useState } from "react"
import { BasicCarousel } from '@/components/doc-components/Carousel'
import { CarouselEditModal } from './CarouselEditModal'
import { usePathname } from "next/navigation"

export const CarouselEditPlugin = (EditorContext: React.Context<any>) => {
  const EditableCarousel = ({ mdastNode }: { mdastNode: any }) => {
    const [showEditModal, setShowEditModal] = useState(false)
    const context = useContext(EditorContext)
    const editorRef = context?.editorRef
    const saveToWebhook = context?.saveToWebhook
    const webhookUrl = context?.webhookUrl || ''
    const authentication = context?.authentication || ''
    const pathname = usePathname()

    const props: Record<string, any> = {}

    // Extract props from mdastNode
    if (mdastNode.attributes && Array.isArray(mdastNode.attributes)) {
      for (const attr of mdastNode.attributes) {
        if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          try {
            props[attr.name] = JSON.parse(attr.value?.value)
          } catch (error) {
            console.error('Error parsing carousel attribute:', attr.name, error)
            props[attr.name] = attr.value?.value
          }
          continue
        }
        // Boolean attributes (like circular) have null value
        props[attr.name] = attr.value === null ? true : attr.value
      }
    }

    const images = props.images || []
    const numVisible = props.numVisible || 3
    const circular = props.circular !== false

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

    const handleUpdate = async (newImages: any[], newNumVisible: number, newCircular: boolean) => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Use the mdastNode position to identify the exact location
      const { start, end } = mdastNode.position

      const before = currentMarkdown.slice(0, start.offset)
      const after = currentMarkdown.slice(end.offset)

      // Build new carousel markdown
      const imagesJson = JSON.stringify(newImages)
      let newCarouselMarkdown = '<Carousel\n'
      newCarouselMarkdown += `  images={${imagesJson}}\n`
      newCarouselMarkdown += `  numVisible={${newNumVisible}}\n`
      newCarouselMarkdown += `  circular={${newCircular}}\n`
      newCarouselMarkdown += '/>'

      const updated = before + newCarouselMarkdown + after

      editorRef.current.setMarkdown(updated)
      await saveToWebhook(updated)

      setShowEditModal(false)
    }

    const handleDelete = async () => {
      if (!editorRef?.current || !saveToWebhook) return

      const currentMarkdown = editorRef.current.getMarkdown()

      // Use the mdastNode position to identify the exact location
      const { start, end } = mdastNode.position

      const before = currentMarkdown.slice(0, start.offset)
      const after = currentMarkdown.slice(end.offset)

      const updated = before + after

      editorRef.current.setMarkdown(updated)
      await saveToWebhook(updated)
    }

    return (
      <div contentEditable={false} style={{ margin: '16px 0', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <BasicCarousel images={images} numVisible={numVisible} circular={circular} />
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
        <CarouselEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
          onUpload={handleUpload}
          initialImages={images}
          initialNumVisible={numVisible}
          initialCircular={circular}
        />
      </div>
    )
  }

  return {
    name: 'Carousel',
    kind: 'flow' as const,
    hasChildren: false,
    Editor: EditableCarousel,
  }
}
