import { useEffect, useState, useRef } from 'react'

export interface Heading {
  level: number
  text: string
  id: string
}

interface TOCProps {
  theme: 'light' | 'dark'
  currentPath?: string // Add this to trigger re-extraction on page change
}

export const TOC: React.FC<TOCProps> = ({ theme, currentPath }) => {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeRef = useRef<HTMLLIElement | null>(null)
  const isUserScrolling = useRef<boolean>(false)
  const scrollTimeoutRef = useRef<number | null>(null)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  // Hide TOC on small screens
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 2048px)')
    setIsLargeScreen(mediaQuery.matches)
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsLargeScreen(e.matches)
    }
    mediaQuery.addEventListener('change', handleMediaQueryChange)
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    }
  }, [])

  // Extract headings from the document
  useEffect(() => {
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll('.tiptap-editor h1, .tiptap-editor h2, .tiptap-editor h3')

      const extractedHeadings: Heading[] = []

      headingElements.forEach((element, index) => {
        // Check if heading is inside a component block (card, accordion, tabs, column, etc.)
        const isInsideComponent = element.closest(
          '.card-node-view, ' +
          '.accordion-node-view-wrapper, .accordion-tab-wrapper, .accordion-tab-content, ' +
          '.tabs-node-view-wrapper, .tab-block-wrapper, .tabs-content-wrapper, ' +
          '.column-group-wrapper, .column-group-content-editable, .column-group-content-preview, ' +
          '.right-panel-wrapper, ' +
          '.code-group-wrapper, ' +
          '.info-node-view, ' +
          '.label-node-view, ' +
          '.endpoint-node-view'
        )

        // Skip headings that are inside component blocks
        if (isInsideComponent) {
          return
        }

        const text = element.textContent?.trim() || ''
        const level = parseInt(element.tagName.substring(1))

        // Generate ID if it doesn't exist
        let id = element.id
        if (!id) {
          id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
          element.id = id
        }

        extractedHeadings.push({ level, text, id })
      })

      setHeadings(extractedHeadings)
    }

    // Initial extraction with a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      extractHeadings()
    }, 100)

    // Re-extract when content changes (using MutationObserver)
    const observer = new MutationObserver(() => {
      extractHeadings()
    })

    const editorElement = document.querySelector('.tiptap-editor')

    if (editorElement) {
      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [currentPath]) // Re-run when currentPath changes

  // Detect user scrolling
  useEffect(() => {
    const handleScroll = () => {
      isUserScrolling.current = true

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        isUserScrolling.current = false
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return

    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter(el => el !== null) as HTMLElement[]

    if (headingElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries[0]
          setActiveId(topEntry.target.id)
        }
      },
      {
        rootMargin: '-150px 0% -70% 0%',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    headingElements.forEach(element => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  // Auto-scroll active item into view in TOC (not the main page)
  useEffect(() => {
    // Don't auto-scroll the TOC if user is actively scrolling the page
    if (isUserScrolling.current || !activeRef.current) return

    // Use a small delay to ensure smooth operation
    const timeoutId = setTimeout(() => {
      if (!activeRef.current) return

      // Check if the element is already visible in the TOC container
      const tocContainer = activeRef.current.closest('aside')
      if (!tocContainer) return

      const elementRect = activeRef.current.getBoundingClientRect()
      const containerRect = tocContainer.getBoundingClientRect()

      // Only scroll if the element is not fully visible in the TOC
      const isVisible =
        elementRect.top >= containerRect.top + 20 &&
        elementRect.bottom <= containerRect.bottom - 20

      if (!isVisible) {
        activeRef.current.scrollIntoView({
          behavior: 'auto', // Use 'auto' instead of 'smooth' to prevent scroll conflicts
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [activeId])

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const navbarHeight = 64 // var(--navbar-height)
      const tabbarHeight = 64 // var(--tabbar-height)
      const offset = navbarHeight + tabbarHeight + 20 // Add 20px buffer

      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  if (!isLargeScreen) {
    return null
  }

  return (
    <aside
      style={{
        width: '180px',
        minWidth: '180px',
        maxWidth: '180px',
        flexShrink: 0,
        position: 'sticky',
        top: 'var(--sidebar-top, 128px)',
        height: 'calc(100vh - var(--sidebar-top, 128px))',
        alignSelf: 'flex-start',
        margin: 0,
        padding: '0px 8px 24px 16px',
        overflowY: 'auto',
        willChange: 'position',
      }}
    >
      {headings.length > 0 && (
        <>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '600',
              margin: '0',
              marginBottom: '16px',
              color: theme === 'light' ? '#6b7280' : '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            On this page
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {headings.map((heading) => {
          const isActive = activeId === heading.id
          const indent = (heading.level - 1) * 12

          return (
            <li
              key={heading.id}
              ref={isActive ? activeRef : null}
              style={{
                marginLeft: `${indent}px`,
                marginBottom: '8px',
                cursor: 'pointer',
              }}
              onClick={() => handleHeadingClick(heading.id)}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: isActive
                    ? (theme === 'light' ? '#3b82f6' : '#60a5fa')
                    : (theme === 'light' ? '#6b7280' : '#9ca3af'),
                  fontWeight: isActive ? '600' : '400',
                  transition: 'color 0.15s',
                  borderLeft: isActive ? `2px solid ${theme === 'light' ? '#3b82f6' : '#60a5fa'}` : '2px solid transparent',
                  paddingLeft: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = theme === 'light' ? '#374151' : '#d1d5db'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = theme === 'light' ? '#6b7280' : '#9ca3af'
                  }
                }}
              >
                {heading.text}
              </span>
            </li>
          )
        })}
          </ul>
        </>
      )}
    </aside>
  )
}
