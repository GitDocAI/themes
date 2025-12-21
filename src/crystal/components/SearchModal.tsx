import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Dialog } from 'primereact/dialog'
import { searchService, type SearchHit, type SearchResponse } from '../../services/searchService'
import './SearchModal.css'

interface SearchModalProps {
  visible: boolean
  onHide: () => void
  onNavigate: (path: string, headingId?: string,tab?:string,version?:string) => void
  theme: 'light' | 'dark'
}

function highlightSearchTerms(text: string, query: string): ReactNode {
  if (!query.trim()) return <span>{text}</span>

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(term => term.replace(/[^a-z0-9]/gi, ''))

  if (searchTerms.length === 0) return <span>{text}</span>

  const regex = new RegExp(`\\b(${searchTerms.join('|')})\\b`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = searchTerms.some(t => t.toLowerCase() === part.toLowerCase())
        return isMatch
          ? <span key={index} className="search-highlight">{part}</span>
          : <span key={index}>{part}</span>
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
  const [results, setResults] = useState<SearchHit[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)

    if (!visible) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }

  }, [visible])

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setResults([])
    try {
      const saved: any[] = []
      await searchService.search(query, 20, (response: SearchResponse) => {
        setSelectedIndex(0)
        saved.push(...response.hits)
        setTimeout(() => setResults(saved), 0)
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
    const parts = [hit.version, hit.tab, hit.group].filter(Boolean)

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
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="search-input-field"
          />
          <button
            className="search-button"
            onClick={performSearch}
            disabled={isSearching || !query.trim()}
            title="Search"
          >
            {isSearching ? (
              <i className="pi pi-spin pi-spinner" />
            ) : (
              <i className="pi pi-arrow-right" />
            )}
          </button>
        </div>


        {/* Empty initial */}
        {!query.trim() && (
          <div className="search-empty">
            <i className="pi pi-search" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="search-empty-text">Start typing to search across all documentation</p>
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

                <div className="search-result-content">
                  {highlightSearchTerms(hit.content_snippet, query)}
                </div>

              </div>
            ))}
          </div>
        )}


        {/* No results */}
        {query.trim() && results.length === 0 && !isSearching && (
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

