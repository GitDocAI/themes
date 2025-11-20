import { useState, useEffect } from 'react'
import { pageLoader } from '../services/pageLoader'

export const useRightPanelContent = (currentPath: string) => {
  const [rightPanelContent, setRightPanelContent] = useState<any[]>([])

  useEffect(() => {
    const detectRightPanel = async () => {
      if (!currentPath) {
        setRightPanelContent([])
        return
      }

      try {
        const pageData = await pageLoader.loadPage(currentPath)
        if (!pageData) {
          setRightPanelContent([])
          return
        }

        // Check if content has Tiptap JSON format
        const content = (pageData as any).content

        if (content && content.type === 'doc' && content.content) {
          // Search for ALL rightPanel nodes in the content
          const findAllRightPanels = (node: any, panels: any[] = []): any[] => {
            if (node.type === 'rightPanel') {
              panels.push(node)
            }
            if (node.content && Array.isArray(node.content)) {
              for (const child of node.content) {
                findAllRightPanels(child, panels)
              }
            }
            return panels
          }

          const rightPanels = findAllRightPanels(content)
          setRightPanelContent(rightPanels)
        } else {
          setRightPanelContent([])
        }
      } catch (err) {
        console.error('[useRightPanelContent] Error detecting RightPanel:', err)
        setRightPanelContent([])
      }
    }

    detectRightPanel()

    // Listen for custom events from PageRenderer when content changes
    const handleContentUpdate = (event: CustomEvent) => {
      const { content } = event.detail

      if (content && content.type === 'doc' && content.content) {
        const findAllRightPanels = (node: any, panels: any[] = []): any[] => {
          if (node.type === 'rightPanel') {
            panels.push(node)
          }
          if (node.content && Array.isArray(node.content)) {
            for (const child of node.content) {
              findAllRightPanels(child, panels)
            }
          }
          return panels
        }

        const rightPanels = findAllRightPanels(content)
        setRightPanelContent(rightPanels)
      } else {
        setRightPanelContent([])
      }
    }

    window.addEventListener('page-content-updated', handleContentUpdate as EventListener)

    return () => {
      window.removeEventListener('page-content-updated', handleContentUpdate as EventListener)
    }
  }, [currentPath])

  return rightPanelContent
}
