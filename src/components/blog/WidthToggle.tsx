'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface WidthContextType {
  isWide: boolean;
  toggleWidth: () => void;
}

const WidthContext = createContext<WidthContextType>({
  isWide: false,
  toggleWidth: () => {},
});

export function useWidth() {
  return useContext(WidthContext);
}

interface WidthToggleProviderProps {
  children: React.ReactNode;
}

export function WidthToggleProvider({ children }: WidthToggleProviderProps) {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
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
    <WidthContext.Provider value={{ isWide, toggleWidth }}>
      <div className={isWide ? 'max-w-7xl' : 'max-w-4xl'} style={{ margin: '0 auto', transition: 'max-width 0.3s ease' }}>
        {children}
      </div>
    </WidthContext.Provider>
  );
}

export default function WidthToggleButton() {
  const { isWide, toggleWidth } = useWidth();

  return (
    <button
      onClick={toggleWidth}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={isWide ? '좁게 보기' : '넓게 보기'}
      aria-label={isWide ? '좁게 보기' : '넓게 보기'}
    >
      {isWide ? (
        // Narrow icon
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--foreground)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
          />
        </svg>
      ) : (
        // Wide icon
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--foreground)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      )}
    </button>
  );
}
