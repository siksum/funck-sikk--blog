'use client';

import { useState, useEffect } from 'react';

export default function TextSizeAdjuster() {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const saved = localStorage.getItem('blog-font-size');
    if (saved) {
      setFontSize(parseInt(saved));
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--blog-font-size', `${fontSize}px`);
    localStorage.setItem('blog-font-size', fontSize.toString());
  }, [fontSize]);

  const decrease = () => setFontSize((prev) => Math.max(12, prev - 2));
  const increase = () => setFontSize((prev) => Math.min(24, prev + 2));
  const reset = () => setFontSize(16);

  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg p-1 border"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <button
        onClick={decrease}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
        aria-label="글자 크기 줄이기"
        disabled={fontSize <= 12}
      >
        <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>A-</span>
      </button>
      <button
        onClick={reset}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors text-xs"
        style={{ color: 'var(--foreground-muted)' }}
        aria-label="글자 크기 초기화"
      >
        {fontSize}
      </button>
      <button
        onClick={increase}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
        aria-label="글자 크기 키우기"
        disabled={fontSize >= 24}
      >
        <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>A+</span>
      </button>
    </div>
  );
}
