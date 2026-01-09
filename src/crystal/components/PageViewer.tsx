import { useState, useEffect } from 'react'
import { pageLoader, type PageData } from '../../services/pageLoader'
import { PageRenderer } from './PageRenderer'
import { ContentService } from '../../services/contentService'
import { apiReferenceLoader } from '../../services/apiReferenceLoader'
import { openApiLoader } from '../../services/openApiLoader'
import { isApiReferencePath } from '../../utils/apiReferenceUtils'
import { ApiReference } from './ApiReference'
import { ErrorBoundary } from './ErrorBoundary'
import type { ApiReferenceProps } from '../../types/ApiReference'

interface PageViewerProps {
  pagePath: string
  theme: 'light' | 'dark'
  isDevMode?: boolean
  allowUpload?: boolean
  openApiSpec?: string // Path to OpenAPI spec file if this is an OpenAPI tab
}

export const PageViewer: React.FC<PageViewerProps> = ({ pagePath, theme, isDevMode = false, allowUpload = false, openApiSpec }) => {
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [apiReferenceData, setApiReferenceData] = useState<ApiReferenceProps | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

        // Check if we have an OpenAPI spec to load from
        if (openApiSpec) {
          // Make sure spec is loaded
          if (!openApiLoader.isSpecLoaded(openApiSpec)) {
            await openApiLoader.loadSpec(openApiSpec)
          }

          // Get endpoint from the spec
          const endpoint = openApiLoader.getEndpoint(openApiSpec, pagePath)

          if (endpoint) {
            setApiReferenceData(endpoint)
            setPageData(null)
            requestAnimationFrame(() => setIsVisible(true))
          } else {
            setError('API endpoint not found')
            setApiReferenceData(null)
            setPageData(null)
          }
        } else if (isApiReferencePath(pagePath)) {
          // Check if this is an API reference page (legacy JSON file approach)
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
          setIsLoading(true)
          const data = await pageLoader.loadPage(pagePath)
          setIsLoading(false)
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
  }, [pagePath, openApiSpec])

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

  if(isLoading){
    return (
    <div className="space-y-8 flex flex-col gap-3">
              {[1, 2, 3,4,5].map((block) => (
                <div key={block} className="space-y-4 my-3 flex flex-col gap-3">
                  <div className="h-7 w-1/3 bg-gray-300 rounded animate-pulse"></div>
                  <div className="space-y-3 flex flex-col gap-3">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
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
        <ErrorBoundary>
          <ApiReference {...apiReferenceData} theme={theme} />
        </ErrorBoundary>
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

  // Show parse error banner if MDX parsing failed (only in non-dev mode)
  // In dev mode, we pass through to show the editor with rawMdx
  if (pageData.parseError && !isDevMode) {
    return (
      <div style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        minHeight: '400px'
      }}>
        <div
          style={{
            padding: '24px',
            margin: '0 0 16px 0',
            backgroundColor: theme === 'dark' ? '#451a1a' : '#fef2f2',
            border: `1px solid ${theme === 'dark' ? '#7f1d1d' : '#fecaca'}`,
            borderRadius: '8px',
            color: theme === 'dark' ? '#fca5a5' : '#991b1b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0 }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                fill={theme === 'dark' ? '#f87171' : '#dc2626'}
              />
            </svg>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              MDX Parsing Error
            </h3>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: 1.5 }}>
            There was an error parsing this page. The MDX content contains syntax errors.
            Please fix the errors in the source file to view and edit this page.
          </p>

          <pre
            style={{
              margin: 0,
              padding: '12px',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#1f2937',
              color: '#f3f4f6',
              borderRadius: '4px',
              fontSize: '13px',
              overflow: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {pageData.parseError}
          </pre>

          <p style={{ margin: '12px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
            Common issues: unclosed tags, missing closing brackets, or invalid JSX syntax.
          </p>
        </div>
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
      content: isTiptapDoc ? pageData.content : pageData.content || undefined,
      // Pass raw MDX and parse error for code editor fallback
      rawMdx: pageData.rawMdx,
      parseError: pageData.parseError
    }

    return (
      <div style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        minHeight: '400px'
      }}>
        <ErrorBoundary>
          <PageRenderer
            pageData={editablePageData}
            theme={theme}
            isDevMode={true}
            allowUpload={allowUpload}
            hasParseError={!!pageData.parseError}
            onSave={async (pageId, updatedData) => {
              // Guard: don't save empty content
              const contentArr = updatedData.content?.content || []
              if (!contentArr || contentArr.length === 0) {
                console.warn('[PageViewer] Attempted to save empty content, skipping')
                return
              }
              // Serialize TipTap content to MDX format
              const tiptapDoc = isTiptapDoc
                ? updatedData.content  // Direct Tiptap doc
                : { type: 'doc', content: contentArr } // Wrap in doc
              // Save as MDX file
              await ContentService.saveContent(pageId, JSON.stringify(tiptapDoc) as any)
            }}
          />
        </ErrorBoundary>
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
      <ErrorBoundary>
        <PageRenderer
          pageData={previewPageData as any}
          theme={theme}
          isDevMode={false}
          allowUpload={allowUpload}
          onSave={async () => {
            // No-op in preview mode
          }}
        />
      </ErrorBoundary>
    </div>
  )
}
