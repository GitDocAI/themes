import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Dialog } from 'primereact/dialog'
import { searchService, type SearchResult } from '../services/searchService'
import './SearchModal.css'

interface SearchModalProps {
  visible: boolean
  onHide: () => void
  onNavigate: (path: string, headingId?: string) => void
  theme: 'light' | 'dark'
}

function highlightSearchTerms(text: string, query: string): ReactNode {
  if (!query.trim()) {
    return <span>{text}</span>
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.replace(/[^a-z0-9]/gi, ''))

  if (searchTerms.length === 0) {
    return <span>{text}</span>
  }

  const regex = new RegExp(
    `\\b(${searchTerms.join('|')})\\b`,
    'gi'
  )

  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = searchTerms.some(term =>
          part.toLowerCase() === term.toLowerCase()
        )

        return isMatch ? (
          <span key={index} className="search-highlight">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </span>
  )
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onHide,
  onNavigate,
  theme
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [indexLoaded, setIndexLoaded] = useState(false)
  const [isMac, setIsMac] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Detect OS
  useEffect(() => {
    setIsMac(navigator.userAgent.toUpperCase().includes('MAC'))
  }, [])

  // Load search index when modal opens
  useEffect(() => {
    if (visible && !indexLoaded) {
      searchService.loadIndex().then(() => {
        setIndexLoaded(true)
      }).catch(error => {
        console.error('Failed to load search index:', error)
      })
    }
  }, [visible, indexLoaded])

  // Focus input when modal opens
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [visible])

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [visible])

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)

      try {
        const searchResults = await searchService.search(query, 20)
        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search
    const timer = setTimeout(performSearch, 100)
    return () => clearTimeout(timer)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, results.length])

  const handleResultClick = (result: SearchResult) => {
    const { chunk } = result

    // Navigate to the page and section with search query for highlighting
    const url = new URL(window.location.href)
    url.searchParams.set('highlight', query)
    window.history.pushState({}, '', url)

    onNavigate(chunk.pagePath, chunk.headingId)

    // Close modal
    onHide()
  }

  const formatBreadcrumb = (result: SearchResult): ReactNode => {
    const breadcrumbParts = [
      result.chunk.version,
      result.chunk.tab,
      result.chunk.sectionTitle
    ]

    return (
      <span className="search-breadcrumb">
        {breadcrumbParts.map((part, index) => (
          <span key={index}>
            {part}
            {index < breadcrumbParts.length - 1 && (
              <i className="pi pi-angle-double-right mx-1.5" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
            )}
          </span>
        ))}
      </span>
    )
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      modal
      dismissableMask
      maskClassName={`search-modal-crystal`}
      className={`search-modal-dialog search-modal-${theme}`}
      style={{ width: '90vw', maxWidth: '700px' }}
      contentStyle={{ padding: 0 }}
    >
      <div className="search-modal-panel">
        {/* Search Input */}
        <div className="search-input-container">
          <i className="pi pi-search search-input-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="search-input-field"
          />
          {isSearching && (
            <i className="pi pi-spin pi-spinner search-loading-spinner" />
          )}
          {isMac !== null && (
            <kbd className="search-kbd">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          )}
        </div>

        {/* Loading state */}
        {!indexLoaded && (
          <div className="search-empty">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }} />
            <span>Loading search index...</span>
          </div>
        )}

        {/* No query state */}
        {indexLoaded && !query.trim() && (
          <div className="search-empty">
            <i className="pi pi-search" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="search-empty-text">Start typing to search across all documentation</p>
          </div>
        )}

        {/* Results */}
        {indexLoaded && query.trim() && results.length > 0 && (
          <div className="search-results-container" ref={resultsRef}>
            {results.map((result, index) => (
              <div
                key={result.chunk.id}
                className={`search-result ${index === selectedIndex ? 'search-result-selected' : ''}`}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-result-header">
                  <i className="pi pi-file-o search-result-icon"></i>
                  <div className="search-result-breadcrumb">
                    {formatBreadcrumb(result)}
                  </div>
                </div>

                <div className="search-result-content">
                  {highlightSearchTerms(result.preview, query)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results state */}
        {indexLoaded && query.trim() && results.length === 0 && !isSearching && (
          <div className="search-empty">
            <i className="pi pi-search" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="search-empty-text">No results found for "{query}"</p>
            <p className="search-empty-hint">Try different keywords or check your spelling</p>
          </div>
        )}
      </div>
    </Dialog>
  )
}
