'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import PostCard from '@/components/post/PostCard';

interface SidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
  categories: { name: string; count: number }[];
  tags: { name: string; count: number }[];
}

export default function Sidebar({
  recentPosts,
  popularPosts,
  categories,
  tags,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');

  return (
    <aside className="space-y-8">
      {/* Posts Tabs */}
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-xl border border-gray-200 dark:border-violet-500/30"
        style={{ background: 'var(--card-bg)' }}
      >
        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 -mb-px'
                : ''
            }`}
            style={activeTab !== 'recent' ? { color: 'var(--foreground-muted)' } : undefined}
          >
            최신 글
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'popular'
                ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 -mb-px'
                : ''
            }`}
            style={activeTab !== 'popular' ? { color: 'var(--foreground-muted)' } : undefined}
          >
            인기 글
          </button>
        </div>

        {/* Tab Content */}
        <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
          {(activeTab === 'recent' ? recentPosts : popularPosts).map((post) => (
            <PostCard key={post.slug} post={post} variant="compact" />
          ))}
          {(activeTab === 'recent' ? recentPosts : popularPosts).length ===
            0 && (
            <p className="p-4 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
              포스트가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div
        className="rounded-2xl backdrop-blur-xl border border-gray-200 dark:border-violet-500/30 p-5"
        style={{ background: 'var(--card-bg)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          카테고리
        </h3>
        <ul className="space-y-2">
          {categories.slice(0, 8).map((category) => (
            <li key={category.name}>
              <Link
                href={`/categories/${encodeURIComponent(category.name)}`}
                className="flex items-center justify-between transition-colors hover:text-violet-600 dark:hover:text-violet-400"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <span>{category.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  {category.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {categories.length > 8 && (
          <Link
            href="/categories"
            className="block mt-4 text-center text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {/* Tags Cloud */}
      <div
        className="rounded-2xl backdrop-blur-xl border border-gray-200 dark:border-violet-500/30 p-5"
        style={{ background: 'var(--card-bg)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          태그
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 text-sm rounded-full transition-all hover:scale-105 border border-violet-200 dark:border-violet-500/40 hover:border-violet-400 dark:hover:border-violet-400"
              style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
        {tags.length > 15 && (
          <Link
            href="/tags"
            className="block mt-4 text-center text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>
    </aside>
  );
}
