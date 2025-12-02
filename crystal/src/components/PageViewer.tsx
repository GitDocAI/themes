import { useState, useEffect } from 'react'
import { pageLoader, type PageData } from '../services/pageLoader'
import { PageRenderer } from './PageRenderer'
import { ContentService } from '../services/contentService'
import { apiReferenceLoader } from '../services/apiReferenceLoader'
import { isApiReferencePath } from '../utils/apiReferenceUtils'
import { ApiReference } from './ApiReference'
import type { ApiReferenceProps } from '../types/ApiReference'

interface PageViewerProps {
  pagePath: string
  theme: 'light' | 'dark'
  isDevMode?: boolean
  allowUpload?: boolean
}

export const PageViewer: React.FC<PageViewerProps> = ({ pagePath, theme, isDevMode = false, allowUpload = false }) => {
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [apiReferenceData, setApiReferenceData] = useState<ApiReferenceProps | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    const loadPage = async () => {
      if (!pagePath) {
        setPageData(null)
        setApiReferenceData(null)
        setIsVisible(false)
        return
      }

      try {
        // Reset visibility on page change
        setIsVisible(false)
        setError(null)

        // Check if this is an API reference page
        if (isApiReferencePath(pagePath)) {
          const apiData = await apiReferenceLoader.loadApiReference(pagePath)

          if (!apiData) {
            setError('API reference not found')
            setApiReferenceData(null)
            setPageData(null)
          } else {
            setApiReferenceData(apiData)
            setPageData(null)
            // Trigger fade-in after content is set
            requestAnimationFrame(() => setIsVisible(true))
          }
        } else {
          // Regular page
          const data = await pageLoader.loadPage(pagePath)

          if (!data) {
            setError('Page not found')
            setPageData(null)
            setApiReferenceData(null)
          } else {
            setPageData(data)
            setApiReferenceData(null)
            // Trigger fade-in after content is set
            requestAnimationFrame(() => setIsVisible(true))
          }
        }
      } catch (err) {
        console.error('Error loading page:', err)
        setError('Failed to load page')
        setPageData(null)
        setApiReferenceData(null)
      }
    }

    loadPage()
  }, [pagePath])

  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c00'
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    )
  }

  // Render API reference page
  if (apiReferenceData) {
    return (
      <div style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        minHeight: '400px'
      }}>
        <ApiReference {...apiReferenceData} theme={theme} />
      </div>
    )
  }

  if (!pageData) {
    return (
      <div style={{ padding: '20px', color: '#6b7280' }}>
        <p>Select a page from the sidebar to view its content.</p>
      </div>
    )
  }

  // If in dev mode, use the editable PageRenderer
  if (isDevMode) {
    // Detect if pageData is a direct Tiptap document (has type: "doc")
    const isTiptapDoc = pageData && pageData.content && pageData.content.type === 'doc'

    const editablePageData = {
      id: pagePath,
      title: pageData.blocks?.find((b) => b.type === 'h1')?.content || 'Untitled',
      description: '',
      // Support both formats: legacy blocks array or new Tiptap content
      blocks: pageData.blocks ? pageData.blocks.map((block, idx) => ({
        ...block,
        id: `block-${idx}`
      })) : undefined,
      // If it's a direct Tiptap doc, use it as content, otherwise pass the whole pageData
      content: isTiptapDoc ? pageData.content : pageData.content || undefined
    }

    return (
      <div style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        minHeight: '400px'
      }}>
        <PageRenderer
          pageData={editablePageData}
          theme={theme}
          isDevMode={true}
          allowUpload={allowUpload}
          onSave={async (pageId, updatedData) => {
            // Serialize TipTap content to MDX format
            const tiptapDoc = isTiptapDoc
              ? updatedData.content  // Direct Tiptap doc
              : { type: 'doc', content: updatedData.content?.content || [] } // Wrap in doc
            // Save as MDX file
            await ContentService.saveContent(pageId, JSON.stringify(tiptapDoc) as any)
          }}
        />
      </div>
    )
  }

  // Preview mode - read-only, use TiptapEditor in non-editable mode
  // Detect if pageData is a direct Tiptap document (has type: "doc")
  const isTiptapDoc = pageData && pageData.content && pageData.content.type === 'doc'

  const previewPageData = {
    id: pagePath,
    title: pageData.blocks?.find((b) => b.type === 'h1')?.content || 'Untitled',
    description: '',
    // Support both formats: legacy blocks array or new Tiptap content
    blocks: pageData.blocks,
    // If it's a direct Tiptap doc, use it as content, otherwise pass the whole pageData
    content: isTiptapDoc ? pageData.content : pageData.content || undefined
  }

  return (
    <div style={{
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      minHeight: '400px'
    }}>
      <PageRenderer
        pageData={previewPageData as any}
        theme={theme}
        isDevMode={false}
        allowUpload={allowUpload}
        onSave={async () => {
          // No-op in preview mode
        }}
      />
    </div>
  )
}
