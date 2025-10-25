'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'

// Dynamic import to avoid SSR issues with MDXEditor
const MDXDocumentEditor = dynamic(
  () => import('./MDXDocumentEditor').then((mod) => mod.MDXDocumentEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-secondary">Loading editor...</div>
      </div>
    ),
  }
)

interface MDXEditorClientProps {
  webhookUrl: string
  authentication: string
}

export const MDXEditorClient: React.FC<MDXEditorClientProps> = ({
  webhookUrl,
  authentication,
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const [markdown, setMarkdown] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const isEditingRef = useRef(false)
  const lastSaveTimeRef = useRef(0)

  // Flush changes to filesystem when navigating away or reloading
  useEffect(() => {
    const flushChanges = () => {
      if (webhookUrl) {
        const flushUrl = webhookUrl.replace(/\/[^/]*$/, '/flush')

        console.log('[MDXEditor] Sending flush request to:', flushUrl)

        // Simple POST without authentication to avoid CORS issues
        // The individual file changes already went through the authenticated webhook
        fetch(flushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
          keepalive: true, // Ensures request completes even if page unloads
        })
          .then(response => {
            console.log('[MDXEditor] Flush response status:', response.status)
            return response.json()
          })
          .then(data => {
            console.log('[MDXEditor] Flush result:', data)
          })
          .catch(err => {
            console.error('[MDXEditor] Flush request failed:', err)
          })
      }
    }

    // Listen for page reload/close
    const handleBeforeUnload = () => {
      flushChanges()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Cleanup function - called when component unmounts (page change)
      flushChanges()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [webhookUrl, authentication])

  // Fetch the original markdown content
  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setIsLoading(true)
        const filePath = pathname + '.mdx'

        // Fetch the raw MDX file with cache-busting timestamp
        const response = await fetch(`/api/get-markdown?path=${encodeURIComponent(filePath)}&t=${Date.now()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch markdown')
        }

        const data = await response.json()
        // Allow empty content - don't throw error
        setMarkdown(data.content || '')
      } catch (err) {
        console.error('Error fetching markdown:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarkdown()
  }, [pathname, refreshKey])

  // Watch for file changes using Server-Sent Events (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const filePath = pathname + '.mdx'
      const eventSource = new EventSource(`/api/watch-file?path=${encodeURIComponent(filePath)}`)

      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'change') {
          // Ignore changes that happened within 2 seconds of our last save
          const timeSinceLastSave = Date.now() - lastSaveTimeRef.current
          if (timeSinceLastSave < 2000) {
            console.debug('Ignoring file change from our own save')
            return
          }

          // Don't update if user is currently editing
          if (isEditingRef.current) {
            console.debug('User is editing, skipping update')
            return
          }

          // File changed externally - fetch new content
          try {
            const response = await fetch(`/api/get-markdown?path=${encodeURIComponent(filePath)}&t=${Date.now()}`)
            if (response.ok) {
              const result = await response.json()
              const newContent = result.content || ''
              setMarkdown(newContent)
              setRefreshKey(prev => prev + 1)
            }
          } catch (err) {
            console.debug('Failed to fetch updated content:', err)
          }
        }
      }

      eventSource.onerror = () => {
        console.debug('SSE connection error, will retry automatically')
      }

      return () => {
        eventSource.close()
      }
    }
  }, [pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-secondary">Loading content...</div>
      </div>
    )
  }

  // Only show error if there's actually an error, not if content is empty
  if (error) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg">
        <p>Unable to load editor.</p>
        <p className="text-sm mt-2">Error: {error}</p>
      </div>
    )
  }

  return (
    <MDXDocumentEditor
      key={refreshKey}
      markdown={markdown}
      webhookUrl={webhookUrl}
      authentication={authentication}
      readOnly={false}
      filePath={pathname}
      isEditingRef={isEditingRef}
      lastSaveTimeRef={lastSaveTimeRef}
    />
  )
}
