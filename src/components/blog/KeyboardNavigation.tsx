'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';

interface KeyboardNavigationProps {
  prevPost: Post | null;
  nextPost: Post | null;
}

export default function KeyboardNavigation({ prevPost, nextPost }: KeyboardNavigationProps) {
  const router = useRouter();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        if (prevPost) {
          router.push(`/blog/${prevPost.slug}`);
        }
      } else if (e.key === 'k' || e.key === 'K') {
        if (nextPost) {
          router.push(`/blog/${nextPost.slug}`);
        }
      } else if (e.key === '?') {
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPost, nextPost, router]);

  if (!showHint) {
    return (
      <button
        onClick={() => setShowHint(true)}
        className="fixed bottom-6 left-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
          hover:scale-110 border border-gray-200 dark:border-violet-500/30 z-40"
        style={{ background: 'var(--card-bg)' }}
        aria-label="키보드 단축키"
      >
        <span className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>?</span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-6 p-4 rounded-xl shadow-lg border z-40 animate-fade-in"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          키보드 단축키
        </h4>
        <button
          onClick={() => setShowHint(false)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" style={{ color: 'var(--foreground-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono" style={{ color: 'var(--foreground)' }}>
            J
          </kbd>
          <span style={{ color: 'var(--foreground-muted)' }}>이전 포스트</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono" style={{ color: 'var(--foreground)' }}>
            K
          </kbd>
          <span style={{ color: 'var(--foreground-muted)' }}>다음 포스트</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono" style={{ color: 'var(--foreground)' }}>
            ?
          </kbd>
          <span style={{ color: 'var(--foreground-muted)' }}>도움말 토글</span>
        </div>
      </div>
    </div>
  );
}
