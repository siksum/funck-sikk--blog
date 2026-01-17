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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            최신 글
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'popular'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            인기 글
          </button>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {(activeTab === 'recent' ? recentPosts : popularPosts).map((post) => (
            <PostCard key={post.slug} post={post} variant="compact" />
          ))}
          {(activeTab === 'recent' ? recentPosts : popularPosts).length ===
            0 && (
            <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              포스트가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          카테고리
        </h3>
        <ul className="space-y-2">
          {categories.slice(0, 8).map((category) => (
            <li key={category.name}>
              <Link
                href={`/categories/${encodeURIComponent(category.name)}`}
                className="flex items-center justify-between text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>{category.name}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {category.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {categories.length > 8 && (
          <Link
            href="/categories"
            className="block mt-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {/* Tags Cloud */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          태그
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
        {tags.length > 15 && (
          <Link
            href="/tags"
            className="block mt-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>
    </aside>
  );
}
