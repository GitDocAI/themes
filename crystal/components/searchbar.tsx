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
          <span key={index} className="text-accent-blue font-semibold bg-accent-blue/10 px-1.5 py-0.5 rounded-md">
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

    const timerId = setTimeout(handleSearch, 100);
    return () => clearTimeout(timerId);
  }, [query]);

  return (
    <>
      <button
        onClick={openModal}
        className="md:w-full flex items-center space-x-3 rounded-xl searchbar-solid px-4 py-2.5 text-sm text-crystal-600 dark:text-crystal-300 transition-all duration-200 hover:text-accent-blue hover:shadow-crystal"
      >
        <i className="w-4 h-4 pi pi-search cursor-pointer" />
        <span className="hidden sm:inline">Search</span>
        {isMac !== null && (
          <kbd className="hidden sm:inline ml-auto text-xs bg-crystal-50 dark:bg-crystal-700 px-2 py-1 rounded-md border border-crystal-200 dark:border-crystal-600 text-crystal-500 dark:text-crystal-400 font-mono">
            {isMac ? '⌘+K' : 'Ctrl+K'}
          </kbd>
        )}
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md animate-fade-in" aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl glass-card mt-16 p-6 animate-slide-up shadow-glass">
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none transition-all duration-200 backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(var(--color-crystal-50), 0.8)',
                borderColor: 'rgba(var(--color-crystal-200), 0.7)',
                color: 'rgb(var(--color-crystal-700))',
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="mt-6 max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
              {results.length === 0 && query.trim() ? (
                <li className="rounded-xl glass p-4 text-center">
                  <div className="text-sm flex flex-col items-center space-y-2" style={{color: 'rgb(var(--color-crystal-500))'}}>
                    <i className="pi pi-search text-2xl" style={{color: 'rgb(var(--color-crystal-400))'}}></i>
                    <span className="dark:text-crystal-300" style={{color: 'inherit'}}>{query.trim() ? 'No results found' : 'Start typing to search...'}</span>
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
                  <li key={index} className="rounded-xl glass hover:shadow-crystal transition-all duration-200 hover:transform hover:scale-[1.01]">
                    <button
                      onClick={() => {
                        closeModal();
                        router.push(url);
                      }}
                      className="block p-4 w-full text-left"
                    >
                      <div className="font-semibold text-crystal-700 dark:text-crystal-200 truncate text-sm mb-2 flex items-center space-x-2">
                        <i className="pi pi-file-o text-accent-blue text-xs"></i>
                        <span>{formattedHeadings}</span>
                      </div>

                      <div className="text-sm text-crystal-600 dark:text-crystal-300 leading-relaxed line-clamp-3">
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
