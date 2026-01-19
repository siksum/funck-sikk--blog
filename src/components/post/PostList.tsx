'use client';

import { useState, useMemo, useEffect } from 'react';
import { Post } from '@/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: Post[];
  showViewToggle?: boolean;
  showFilters?: boolean;
  defaultView?: 'grid' | 'list';
}

export default function PostList({
  posts,
  showViewToggle = true,
  showFilters = true,
  defaultView = 'grid',
}: PostListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(term) ||
          post.description?.toLowerCase().includes(term) ||
          post.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.title.localeCompare(b.title, 'ko');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [posts, searchTerm, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: 'date' | 'title') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'date' ? 'desc' : 'asc');
    }
  };

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
      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search Input */}
        {showFilters && (
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="제목, 설명, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
                color: 'var(--foreground)',
              }}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--foreground-muted)' }}
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
          </div>
        )}

        {/* Sort and View Controls */}
        <div className="flex gap-2">
          {/* Sort Buttons */}
          {showFilters && (
            <div
              className="inline-flex rounded-lg p-1 border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <button
                onClick={() => handleSortChange('date')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  sortBy === 'date'
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                    : 'hover:bg-gray-100 dark:hover:bg-violet-500/10'
                }`}
                style={{ color: sortBy === 'date' ? undefined : 'var(--foreground-muted)' }}
              >
                날짜
                {sortBy === 'date' && (
                  <span className="text-violet-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSortChange('title')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  sortBy === 'title'
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                    : 'hover:bg-gray-100 dark:hover:bg-violet-500/10'
                }`}
                style={{ color: sortBy === 'title' ? undefined : 'var(--foreground-muted)' }}
              >
                제목
                {sortBy === 'title' && (
                  <span className="text-violet-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          )}

          {/* View Toggle */}
          {showViewToggle && (
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
      </div>

      {/* Search result info */}
      {showFilters && searchTerm && (
        <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
          {filteredAndSortedPosts.length}개 검색됨 (전체 {posts.length}개)
        </p>
      )}

      {/* Posts */}
      {filteredAndSortedPosts.length === 0 ? (
        <p
          className="text-center py-12"
          style={{ color: 'var(--foreground-muted)' }}
        >
          검색 결과가 없습니다.
        </p>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredAndSortedPosts.map((post) => (
            <PostCard key={post.slug} post={post} variant="list" commentCount={commentCounts[post.slug] || 0} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPosts.map((post) => (
            <PostCard key={post.slug} post={post} commentCount={commentCounts[post.slug] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}
