'use client';
import { useState, useEffect } from 'react';
import {ReactNode} from 'react'
import { Dialog } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import {Chunk} from '@/shared/file_indexer/model/DocumentData'

interface SearchResult {
  doc: {
    path: string;
    chunk: Chunk;
    content: string;
  };
  score: number;
}

function highlightSearchTerms(text: string, query: string): ReactNode {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.replace(/[^a-z0-9]/gi, ''));

  if (searchTerms.length === 0) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(
    `\\b(${searchTerms.join('|')})\\b`,
    'gi'
  );

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = searchTerms.some(term =>
          part.toLowerCase() === term.toLowerCase()
        );

        return isMatch ? (
          <span key={index} className="text-primary font-semibold bg-primary/10 px-1 rounded">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}

function createContextWindow(text: string, query: string, windowSize: number = 150): string {
  if (!query.trim()) {
    return text.substring(0, windowSize * 2) + (text.length > windowSize * 2 ? '...' : '');
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.replace(/[^a-z0-9]/gi, ''));

  const lowerText = text.toLowerCase();
  let bestMatch = -1;
  let bestMatchLength = 0;

  for (const term of searchTerms) {
    const index = lowerText.indexOf(term);
    if (index !== -1) {
      let matchLength = term.length;
      let tempIndex = index;

      for (const otherTerm of searchTerms) {
        if (otherTerm !== term) {
          const nearbyIndex = lowerText.indexOf(otherTerm, Math.max(0, tempIndex - windowSize));
          if (nearbyIndex !== -1 && nearbyIndex <= tempIndex + windowSize) {
            matchLength += otherTerm.length;
          }
        }
      }

      if (matchLength > bestMatchLength) {
        bestMatch = index;
        bestMatchLength = matchLength;
      }
    }
  }

  if (bestMatch === -1) {
    return text.substring(0, windowSize * 2) + (text.length > windowSize * 2 ? '...' : '');
  }

  const start = Math.max(0, bestMatch - windowSize);
  const end = Math.min(text.length, bestMatch + bestMatchLength + windowSize);

  let contextText = text.substring(start, end);

  if (start > 0) contextText = '...' + contextText;
  if (end < text.length) contextText = contextText + '...';

  return contextText;
}

function formatHeadingPath(headingPath: string[]): ReactNode {
  if (!headingPath || headingPath.length === 0) {
    return '';
  }

  const maxLevels = 3;
  const displayPath:ReactNode[] = headingPath.length > maxLevels
    ? ['...', ...headingPath.slice(-maxLevels)]
    : headingPath;

  return <span className="flex flex-row items-center text-primary"> {displayPath.map((elem,index)=>(<span key={`${index + Date.now()}-${elem}`}>{elem}{index<displayPath.length-1?<i className="mx-1 pi  pi-angle-double-right"></i>:null}</span>))}</span>
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isMac, setIsMac] = useState<boolean | null>(null);
  const router = useRouter();

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isShortcut = isMac ? e.metaKey && e.key === 'k' : e.ctrlKey && e.key === 'k';
      if (isShortcut) {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          console.error('Failed to fetch search results');
          return;
        }

        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Error during search:', error);
      }
    };

    const timerId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timerId);
  }, [query]);

  return (
    <>
      <button
        onClick={openModal}
        className="md:w-full flex items-center sm:space-x-2 rounded-lg md:border md:border-secondary/30 bg-background sm:px-4 py-2 text-sm text-gray-600 md:shadow-sm transition hover:md:shadow-md "
      >
        <i className="w-4 h-4 pi pi-search cursor-pointer" />
        <span className="hidden sm:inline">Search</span>
        {isMac !== null && (
          <kbd className="hidden sm:inline ml-auto text-xs text-secondary">{isMac ? '⌘+K' : 'Ctl+K'}</kbd>
        )}
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-center">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-background shadow-xl mt-12 p-2">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-md border border-secondary px-4 py-2 text-sm focus:border-secondary focus:outline-none focus:ring text-secondary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
              {results.length === 0 && query.trim() ? (
                <li className="rounded-md">
                  <div className="block p-4 text-center">
                    <div className="text-sm text-secondary/70">
                      {query.trim() ? 'No results found' : 'Start typing to search...'}
                    </div>
                  </div>
                </li>
              ) : null}

              {results.map((result, index) => {
                const path = result.doc.path.replace(/\.mdx$/, '');
                const url = `/${path}#${result.doc.chunk.headingPath[result.doc.chunk.headingPath.length-1]}`;

                const contextText = createContextWindow(result.doc.chunk.text, query, 120);

                const headingPath = result.doc.chunk.headingPath || [];
                const formattedHeadings = formatHeadingPath(headingPath);

                return (
                  <li key={index} className="rounded-md hover:bg-secondary/10 transition-colors">
                    <button
                      onClick={() => {
                        closeModal();
                        router.push(url);
                      }}
                      className="block p-3 w-full text-left"
                    >
                      <div className="font-medium text-primary/90 truncate text-sm mb-1">
                        {formattedHeadings}
                      </div>

                      <div className="text-sm text-secondary/80 leading-relaxed line-clamp-3">
                        {highlightSearchTerms(contextText, query)}
                      </div>

                    </button>
                  </li>
                );
              })}
            </ul>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
