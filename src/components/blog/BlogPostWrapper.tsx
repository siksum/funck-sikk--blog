'use client';

import { useState, useEffect } from 'react';

interface BlogPostWrapperProps {
  children: React.ReactNode;
}

export default function BlogPostWrapper({ children }: BlogPostWrapperProps) {
  const [isWide, setIsWide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('blog-width-preference');
    if (saved === 'wide') {
      setIsWide(true);
    }
  }, []);

  const toggleWidth = () => {
    setIsWide((prev) => {
      const newValue = !prev;
      localStorage.setItem('blog-width-preference', newValue ? 'wide' : 'normal');
      return newValue;
    });
  };

  return (
    <article
      className={`${isWide ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-300`}
    >
      {/* Width Toggle Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleWidth}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={isWide ? '좁게 보기' : '넓게 보기'}
        >
          {mounted && (
            <>
              {isWide ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    />
                  </svg>
                  <span>좁게 보기</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                    />
                  </svg>
                  <span>넓게 보기</span>
                </>
              )}
            </>
          )}
        </button>
      </div>
      {children}
    </article>
  );
}
