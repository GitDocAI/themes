import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Dialog } from 'primereact/dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { searchService, type SearchHit, type SearchResponse } from '../../services/searchService'
import './SearchModal.css'

interface SearchModalProps {
  visible: boolean
  onHide: () => void
  onNavigate: (path: string, headingId?: string,tab?:string,version?:string) => void
  theme: 'light' | 'dark'
  isDevMode?: boolean
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onHide,
  onNavigate,
  theme,
  isDevMode = false
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)

    if (!visible) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setHasSearched(false)
    }

  }, [visible])

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setResults([])
    setHasSearched(true)
    try {
      const saved: any[] = []
      await searchService.search(query, 20, (response: SearchResponse) => {
        setSelectedIndex(0)
        saved.push(...response.hits)
        // Sort by score descending (highest score first)
        const sorted = [...saved].sort((a, b) => (b.score || 0) - (a.score || 0))
        setTimeout(() => setResults(sorted), 0)
      }, () => {
        setTimeout(() => {}, 0)
        setIsSearching(false)
      })
    } catch (err) {
      console.error('Search error:', err)
      setIsSearching(false)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // If there are results and one is selected, navigate to it
      if (results.length > 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex])
      } else {
        // Otherwise, perform search
        performSearch()
      }
      return
    }

    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    }
  }


  useEffect(() => {
    if (!resultsRef.current) return
    const element = resultsRef.current.children[selectedIndex] as HTMLElement
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex, results.length])


  const handleResultClick = (hit: SearchHit) => {
    const highlightUrl = new URL(window.location.href)
    highlightUrl.searchParams.set('highlight', query)
    window.history.pushState({}, '', highlightUrl)
    onNavigate(hit.page_name ?? '', hit.document_id,hit.tab,hit.version)
    onHide()
  }



  const formatBreadcrumb = (hit: SearchHit): ReactNode => {
    // Filter out 'default' version as it's the implicit version when no versions exist
    const version = hit.version?.toLowerCase() === 'default' ? null : hit.version
    const parts = [version, hit.tab, hit.group].filter(Boolean)

    return (
      <span className="search-breadcrumb">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
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
      maskClassName="search-modal-crystal"
      className={`search-modal-dialog search-modal-${theme}`}
      style={{ width: '90vw', maxWidth: '700px' }}
      contentStyle={{ padding: 0 }}
    >
      <div className="search-modal-panel">

        {/* Input */}
        <div className="search-input-container">
          <i className="pi pi-search search-input-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => !isDevMode && setQuery(e.target.value)}
            onKeyDown={!isDevMode ? handleKeyDown : undefined}
            placeholder="Search documentation..."
            className="search-input-field"
            readOnly={isDevMode}
            style={isDevMode ? { cursor: 'default' } : undefined}
          />
          <button
            className="search-button"
            onClick={!isDevMode ? performSearch : undefined}
            disabled={isDevMode || isSearching || !query.trim()}
            title={isDevMode ? "Disabled in preview mode" : "Search"}
            style={isDevMode ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
          >
            {isSearching ? (
              <i className="pi pi-spin pi-spinner" />
            ) : (
              <i className="pi pi-arrow-right" />
            )}
          </button>
        </div>


        {/* Empty initial - Dev mode shows example results */}
        {!query.trim() && isDevMode && (
          <div className="search-results-container" style={{ opacity: 0.7 }}>
            <div style={{
              padding: '8px 16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <i className="pi pi-eye" style={{ fontSize: '0.7rem' }}></i>
              Example Results Preview
            </div>
            {/* Example result 1 */}
            <div className="search-result">
              <div className="search-result-header">
                <i className="pi pi-file-o search-result-icon"></i>
                <div className="search-result-breadcrumb">
                  <span>Documentation</span>
                  <i className="pi pi-angle-double-right mx-1.5" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
                  <span>Getting Started</span>
                </div>
              </div>
              <div className="search-result-content search-markdown-content">
                <p>Welcome to the documentation. This guide will help you get started with the <strong>installation</strong> and basic configuration...</p>
              </div>
            </div>
            {/* Example result 2 */}
            <div className="search-result">
              <div className="search-result-header">
                <i className="pi pi-file-o search-result-icon"></i>
                <div className="search-result-breadcrumb">
                  <span>API Reference</span>
                  <i className="pi pi-angle-double-right mx-1.5" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
                  <span>Authentication</span>
                </div>
              </div>
              <div className="search-result-content search-markdown-content">
                <p>Learn how to authenticate your API requests using <strong>API keys</strong> or OAuth tokens...</p>
              </div>
            </div>
            {/* Example result 3 */}
            <div className="search-result">
              <div className="search-result-header">
                <i className="pi pi-file-o search-result-icon"></i>
                <div className="search-result-breadcrumb">
                  <span>Guides</span>
                  <i className="pi pi-angle-double-right mx-1.5" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
                  <span>Best Practices</span>
                </div>
              </div>
              <div className="search-result-content search-markdown-content">
                <p>Follow these <strong>best practices</strong> to ensure optimal performance and security in your implementation...</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty initial - Production mode */}
        {!query.trim() && !isDevMode && (
          <div className="search-empty">
            <i className="pi pi-search" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="search-empty-text">Type your search and press Enter</p>
          </div>
        )}

        {/* Has query but hasn't searched yet */}
        {query.trim() && !hasSearched && !isSearching && results.length === 0 && (
          <div className="search-empty">
            <i className="pi pi-arrow-right" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="search-empty-text">Press Enter or click the button to search</p>
          </div>
        )}


        {/* Results */}
        {query.trim() && results.length > 0 && (
          <div className="search-results-container" ref={resultsRef}>
            {results.map((hit, index) => (
              <div
                key={hit.document_id}
                className={`search-result ${index === selectedIndex ? 'search-result-selected' : ''}`}
                onClick={() => handleResultClick(hit)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="search-result-header">
                  <i className="pi pi-file-o search-result-icon"></i>
                  <div className="search-result-breadcrumb">
                    {formatBreadcrumb(hit)}
                  </div>
                </div>

                <div className="search-result-content search-markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {hit.content_snippet}
                  </ReactMarkdown>
                </div>

              </div>
            ))}
          </div>
        )}


        {/* No results */}
        {query.trim() && results.length === 0 && !isSearching && hasSearched && (
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

