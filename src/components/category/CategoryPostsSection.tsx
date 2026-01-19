'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types';
import PostCard from '@/components/post/PostCard';

interface CategoryPostsSectionProps {
  posts: Post[];
  categoryName: string;
  totalPostCount: number;
  childCategoryCount: number;
}

export default function CategoryPostsSection({
  posts,
  categoryName,
  totalPostCount,
  childCategoryCount,
}: CategoryPostsSectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // Fetch comment counts
  useEffect(() => {
    const fetchCommentCounts = async () => {
      try {
        const res = await fetch('/api/comments/counts');
        if (res.ok) {
          const data = await res.json();
          setCommentCounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch comment counts:', error);
      }
    };
    fetchCommentCounts();
  }, []);

  return (
    <>
      {/* Header with title and view toggle */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            {categoryName}
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }} className="mt-2">
            {totalPostCount}개의 포스트
            {childCategoryCount > 0 && ` (하위 카테고리 ${childCategoryCount}개)`}
          </p>
        </div>

        {/* View Toggle */}
        {posts.length > 0 && (
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
        )}
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        viewMode === 'list' ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} variant="list" commentCount={commentCounts[post.slug] || 0} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} commentCount={commentCounts[post.slug] || 0} />
            ))}
          </div>
        )
      )}
    </>
  );
}
