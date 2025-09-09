'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useEffect } from 'react';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

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

  const handleSearch = async () => {
    if (!query.trim()) return;

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              autoFocus
            />
            <ul className="mt-4">
              {results.map((result, index) => (
                <li key={index} className="p-2 border-b border-gray-300">
                  <a href={result.filePath} className="text-blue-500 hover:underline">
                    {result.filePath} (Score: {result.score.toFixed(2)})
                  </a>
                </li>
              ))}
            </ul>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
