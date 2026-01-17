'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Post } from '@/types';
import { searchPosts } from '@/lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const searchResults = searchPosts(query);
      setResults(searchResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleResultClick = useCallback(
    (slug: string) => {
      onClose();
      setQuery('');
      router.push(`/blog/${slug}`);
    },
    [onClose, router]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="포스트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-5 py-4 text-lg border-b border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white focus:outline-none"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <svg
                  className="w-5 h-5 animate-spin text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((post) => (
                  <li key={post.slug}>
                    <button
                      onClick={() => handleResultClick(post.slug)}
                      className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {post.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {post.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {post.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() && !isSearching ? (
              <div className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : !query.trim() ? (
              <div className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p>검색어를 입력하세요.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
