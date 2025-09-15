'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  doc: {
    path: string;
    chunk: number;
    content: string;
  };
  score: number;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

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
        className="md:w-full flex items-center space-x-2 rounded-lg md:border md:border-secondary bg-background px-4 py-2 text-sm text-gray-600 md:shadow-sm transition hover:md:shadow-md "
      >
        <i className="w-4 h-4 pi pi-search cursor-pointer" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline ml-auto text-xs text-secondary">{isMac ? '⌘+K' : 'Ctl+K'}</kbd>
      </button>

      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0  backdrop-blur-sm " aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-center ">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-background  shadow-xl mt-12 p-2 ">
            <input
              type="text"
              placeholder="Search"
              className=" w-full rounded-md border border-secondary px-4 py-2 text-sm focus:border-secondary focus:outline-none focus:ring text-secondary "
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
              {results.length==0?
                  <li className="rounded-md hover:bg-secondary/10">
                    <button
                      onClick={() => {
                        closeModal();
                      }}
                      className="block p-2 w-full text-left"
                    >
                      {/* <div className="font-semibold text-primary truncate">{path}</div> */}
                      <div className="text-sm text-secondary mt-1 line-clamp-2">no results founded</div>
                    </button>
                  </li>
                :<></>

              }
              {results.map((result, index) => {
                const path = result.doc.path.replace(/\.mdx$/, '');
                const url = `/${path}?scroll=${result.doc.chunk * 10000}`;
                return (
                  <li key={index} className="rounded-md hover:bg-secondary/10">
                    <button
                      onClick={() => {
                        closeModal();
                        router.push(url);
                      }}
                      className="block p-2 w-full text-left"
                    >
                      <div className="font-semibold text-primary truncate">{path}</div>
                      <div className="text-sm text-secondary mt-1 line-clamp-2">...{result.doc.content}...</div>
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
