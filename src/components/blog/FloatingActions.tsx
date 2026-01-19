'use client';

import { useState, useEffect } from 'react';

export default function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed right-6 bottom-6 flex flex-col gap-3 z-40">
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
          hover:scale-110 border border-gray-200 dark:border-violet-500/30
          hover:border-violet-300 dark:hover:border-violet-400/60"
        style={{ background: 'var(--card-bg)' }}
        aria-label="공유하기"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
            hover:scale-110 border border-gray-200 dark:border-violet-500/30
            hover:border-violet-300 dark:hover:border-violet-400/60
            animate-fade-in"
          style={{ background: 'var(--card-bg)' }}
          aria-label="맨 위로"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
