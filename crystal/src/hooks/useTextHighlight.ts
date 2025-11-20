import { useEffect } from 'react'

/**
 * Hook to highlight search terms in the page content
 * Highlights text matching the query parameter for a few seconds
 */
export function useTextHighlight() {
  useEffect(() => {
    // Get highlight query from URL
    const params = new URLSearchParams(window.location.search)
    const highlightQuery = params.get('highlight')

    if (!highlightQuery) return

    // Function to highlight text in the DOM
    const highlightText = () => {
      const searchTerms = highlightQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 2)
        .map(term => term.replace(/[^a-z0-9]/gi, ''))

      if (searchTerms.length === 0) return

      // Find all text nodes in the main content
      const contentArea = document.querySelector('.ProseMirror, main, article, [role="main"]')
      if (!contentArea) return

      const walker = document.createTreeWalker(
        contentArea,
        NodeFilter.SHOW_TEXT,
        null
      )

      const textNodes: Text[] = []
      let node: Node | null

      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
          textNodes.push(node as Text)
        }
      }

      // Create regex for matching
      const regex = new RegExp(
        `\\b(${searchTerms.join('|')})\\b`,
        'gi'
      )

      const highlightedElements: HTMLElement[] = []

      // Highlight matching text
      textNodes.forEach(textNode => {
        const text = textNode.textContent || ''
        const matches = text.match(regex)

        if (matches) {
          const span = document.createElement('span')
          span.innerHTML = text.replace(regex, (match) => {
            return `<mark style="
              background-color: #fef08a;
              color: #854d0e;
              padding: 2px 4px;
              border-radius: 3px;
              animation: highlight-fade 3s ease-out forwards;
            ">${match}</mark>`
          })

          const parent = textNode.parentNode
          if (parent) {
            parent.replaceChild(span, textNode)
            const marks = span.querySelectorAll('mark')
            marks.forEach(mark => highlightedElements.push(mark as HTMLElement))
          }
        }
      })

      // Add CSS animation
      if (!document.getElementById('highlight-animation-style')) {
        const style = document.createElement('style')
        style.id = 'highlight-animation-style'
        style.textContent = `
          @keyframes highlight-fade {
            0% {
              background-color: #fef08a;
            }
            70% {
              background-color: #fef08a;
            }
            100% {
              background-color: transparent;
              padding: 0;
            }
          }
        `
        document.head.appendChild(style)
      }

      // Scroll to first highlight
      if (highlightedElements.length > 0) {
        setTimeout(() => {
          highlightedElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      }

      // Remove highlight parameter from URL after highlighting
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('highlight')
        window.history.replaceState({}, '', url)
      }, 3500)
    }

    // Wait for content to load before highlighting
    setTimeout(highlightText, 500)
  }, [])
}
