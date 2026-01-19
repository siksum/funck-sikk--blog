'use client';

import { useState, useEffect, useCallback } from 'react';

export default function HighlightShare() {
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseUp = useCallback(() => {
    const selectedText = window.getSelection()?.toString().trim();

    if (selectedText && selectedText.length > 10) {
      const range = window.getSelection()?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setSelection({
          text: selectedText.slice(0, 280), // Limit to tweet length
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    } else {
      setSelection(null);
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setSelection(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  const shareToTwitter = () => {
    const url = window.location.href;
    const tweetText = `"${selection?.text}" ${url}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      '_blank'
    );
    setSelection(null);
  };

  const copyQuote = async () => {
    if (selection) {
      await navigator.clipboard.writeText(`"${selection.text}" - ${window.location.href}`);
      setSelection(null);
    }
  };

  if (!selection) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-1 p-1 rounded-lg shadow-lg border animate-fade-in"
      style={{
        left: `${selection.x}px`,
        top: `${selection.y + window.scrollY}px`,
        transform: 'translate(-50%, -100%)',
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
      }}
    >
      <button
        onClick={shareToTwitter}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        aria-label="Twitter에 공유"
      >
        <svg className="w-4 h-4" style={{ color: 'var(--foreground)' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={copyQuote}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        aria-label="인용 복사"
      >
        <svg className="w-4 h-4" style={{ color: 'var(--foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      {/* Arrow */}
      <div
        className="absolute left-1/2 bottom-0 w-3 h-3 transform -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      />
    </div>
  );
}
