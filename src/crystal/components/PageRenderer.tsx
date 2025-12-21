import { useState, useEffect, useRef } from 'react'
import type { Block } from './blocks/BlockRenderer'
import { TiptapEditor } from './editor/TiptapEditor'
import { SaveNotification } from './SaveNotification'

interface PageData {
  id: string
  title: string
  description?: string
  blocks?: Block[] // Legacy format
  content?: Record<string, any> // Tiptap JSON format
}

interface PageRendererProps {
  pageData: PageData
  theme: 'light' | 'dark'
  onSave: (pageId: string, updatedData: PageData) => Promise<void>
  isDevMode?: boolean
  allowUpload?: boolean
}

export const PageRenderer: React.FC<PageRendererProps> = ({ pageData, theme, onSave, isDevMode = false, allowUpload = false }) => {
  // Convert legacy format to Tiptap JSON if needed
  const [content, setContent] = useState<Record<string, any>>(pageData.content || convertBlocksToTiptap(pageData.blocks || []))
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)
  const contentRef = useRef<Record<string, any>>(content)
  const hasChangesRef = useRef<boolean>(hasChanges)
  const pageIdRef = useRef<string>(pageData.id)
  const pageDataRef = useRef<PageData>(pageData)

  // Keep refs in sync
  useEffect(() => {
    contentRef.current = content
    hasChangesRef.current = hasChanges
  }, [content, hasChanges])

  // Save before page changes
  useEffect(() => {
    // When pageData.id changes, save the previous page if there were changes
    return () => {
      // This runs before the component unmounts or before the effect runs again
      // At this point, the refs still have the OLD page's data
      if (hasChangesRef.current && pageIdRef.current) {
        // Save using the refs which have the OLD page data
        onSave(pageIdRef.current, { ...pageDataRef.current, content: contentRef.current }).catch(err => {
          console.error('[PageRenderer] Failed to save on page change:', err)
        })
      }
    }
  }, [pageData.id, onSave])

  // Update pageId ref AFTER the save effect
  useEffect(() => {
    pageIdRef.current = pageData.id
    pageDataRef.current = pageData
  }, [pageData.id, pageData])

  // Reset content when page changes
  useEffect(() => {
    const newContent = pageData.content || convertBlocksToTiptap(pageData.blocks || [])
    setContent(newContent)
    contentRef.current = newContent
    setHasChanges(false)
    hasChangesRef.current = false
  }, [pageData.id, pageData.content, pageData.blocks])

  const handleTiptapUpdate = (updatedContent: Record<string, any>) => {
    setContent(updatedContent)
    setHasChanges(true)

    // Emit custom event for RightPanel detection
    const event = new CustomEvent('page-content-updated', {
      detail: { content: updatedContent }
    })
    window.dispatchEvent(event)
  }

  const handleSave = async (showNotification = false) => {
    if (!hasChangesRef.current) {
      if (showNotification) {
        // Show notification even if no changes (user pressed Ctrl+S)
        setShowSaveNotification(true)
        setTimeout(() => setShowSaveNotification(false), 100)
      }
      return
    }

    try {
      // Save in Tiptap JSON format
      await onSave(pageData.id, { ...pageData, content: contentRef.current })
      setHasChanges(false)

      // Show success notification
      if (showNotification) {
        setShowSaveNotification(true)
        setTimeout(() => setShowSaveNotification(false), 100)
      }
    } catch (error) {
      console.error('[PageRenderer] Error saving page:', error)
      // Silently fail, will retry on next save
    }
  }

  // Auto-save after 10 seconds of inactivity
  useEffect(() => {
    if (hasChanges) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for 10 seconds
      saveTimeoutRef.current = setTimeout(() => {
        handleSave()
      }, 10000)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [hasChanges])

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave(true) // Pass true to show notification
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // Empty deps because handleSave uses refs

  // Save when navigating away or reloading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        // Synchronous save - browsers may block async operations
        // Use sendBeacon for better reliability
        const data = JSON.stringify({
          content: JSON.stringify({ ...pageData, content: contentRef.current }, null, 2)
        })

        const jsonPath = pageData.id.replace(/\.mdx$/, '.json')
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'
        const url = `${backendUrl}/docs/${jsonPath}`

        // Try sendBeacon first (more reliable on page unload)
        const sent = navigator.sendBeacon(
          url,
          new Blob([data], { type: 'application/json' })
        )

        if (!sent) {
          // Fallback to showing warning
          e.preventDefault()
          return 'You have unsaved changes. Are you sure you want to leave?'
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pageData.id])

  return (
    <div style={{ position: 'relative', margin: '0', padding: '0' }}>
      {/* Save notification */}
      <SaveNotification show={showSaveNotification} theme={theme} />

      {/* Render content - Always use Tiptap */}
      <TiptapEditor
        key={`tiptap-${isDevMode ? 'dev' : 'preview'}`}
        content={content}
        theme={theme}
        onUpdate={handleTiptapUpdate}
        editable={isDevMode}
        allowUpload={allowUpload}
      />
    </div>
  )
}

// Convert legacy blocks format to Tiptap JSON format
function convertBlocksToTiptap(blocks: Block[]): any {
  return {
    type: 'doc',
    content: blocks.map((block) => {
      switch (block.type) {
        case 'h1':
        case 'h2':
        case 'h3': {
          const level = block.type === 'h1' ? 1 : block.type === 'h2' ? 2 : 3
          return {
            type: 'heading',
            attrs: { level },
            content: block.content && block.content.trim()
              ? [{ type: 'text', text: block.content }]
              : undefined,
          }
        }

        case 'paragraph':
          return {
            type: 'paragraph',
            content: block.content && block.content.trim()
              ? [{ type: 'text', text: block.content }]
              : undefined,
          }

        case 'blockquote':
          return {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: block.content && block.content.trim()
                  ? [{ type: 'text', text: block.content }]
                  : undefined,
              },
            ],
          }

        case 'bullet-list':
          return {
            type: 'bulletList',
            content: (block.items || []).map((item: string) => ({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: item.trim() ? [{ type: 'text', text: item }] : undefined,
                },
              ],
            })),
          }

        case 'numbered-list':
          return {
            type: 'orderedList',
            content: (block.items || []).map((item: string) => ({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: item.trim() ? [{ type: 'text', text: item }] : undefined,
                },
              ],
            })),
          }

        case 'code':
          return {
            type: 'codeBlock',
            attrs: {
              language: block.language || 'plaintext',
            },
            content: block.code && block.code.trim()
              ? [{ type: 'text', text: block.code }]
              : undefined,
          }

        case 'card':
          return {
            type: 'cardBlock',
            attrs: {
              id: block.id,
              title: block.title || '',
              icon: block.icon || '',
              href: block.href || '',
            },
          }

        case 'codegroup':
          return {
            type: 'codeGroupBlock',
            attrs: {
              id: block.id,
              tabs: block.tabs || [],
            },
          }

        case 'info':
          return {
            type: 'infoBlock',
            attrs: {
              id: block.id,
              type: block.infoType || 'info',
              title: block.title || '',
              content: block.content || '',
            },
          }

        case 'separator':
          return {
            type: 'horizontalRule',
          }

        default:
          return {
            type: 'paragraph',
            content: [{ type: 'text', text: `Unknown block type: ${block.type}` }],
          }
      }
    }),
  }
}
