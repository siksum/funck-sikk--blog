'use client';

import { useState } from 'react';
import { Post } from '@/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: Post[];
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
}

export default function PostList({
  posts,
  showViewToggle = true,
  defaultView = 'grid',
}: PostListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-violet-400 dark:text-violet-500"
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
        <p style={{ color: 'var(--foreground-muted)' }}>
          아직 작성된 포스트가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* View Toggle */}
      {showViewToggle && (
        <div className="flex justify-end mb-4">
          <div
            className="inline-flex rounded-lg p-1 border border-gray-200 dark:border-violet-500/30"
            style={{ background: 'var(--card-bg)' }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                  : 'hover:bg-gray-100 dark:hover:bg-violet-500/10'
              }`}
              style={{ color: viewMode === 'grid' ? undefined : 'var(--foreground-muted)' }}
              aria-label="카드 보기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                  : 'hover:bg-gray-100 dark:hover:bg-violet-500/10'
              }`}
              style={{ color: viewMode === 'list' ? undefined : 'var(--foreground-muted)' }}
              aria-label="리스트 보기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} variant="list" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
