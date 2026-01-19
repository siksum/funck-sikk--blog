'use client';

import { useState } from 'react';
import { Post, Category } from '@/types';
import CategoryCard from '@/components/category/CategoryCard';
import Sidebar from '@/components/sidebar/Sidebar';

interface CategoryWithTags {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface BlogPageContentProps {
  rootCategoriesWithTags: CategoryWithTags[];
  recentPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
}

export default function BlogPageContent({
  rootCategoriesWithTags,
  recentPosts,
  categories,
  tags,
}: BlogPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen py-12">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Page Header with View Toggle */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-300 dark:to-indigo-400">
                Blog
              </span>
            </h1>
            <p style={{ color: 'var(--foreground-muted)' }}>
              카테고리별로 정리된 개발 기록을 탐색해보세요
            </p>
          </div>

          {/* View Toggle */}
          {rootCategoriesWithTags.length > 0 && (
            <div
              className="inline-flex rounded-lg p-1 border"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
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

        <div className="lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
          {/* Sidebar - Left */}
          <div className="mb-8 lg:mb-0 lg:col-span-1 lg:order-first">
            <Sidebar
              recentPosts={recentPosts}
              popularPosts={recentPosts}
              categories={categories}
              tags={tags}
            />
          </div>

          {/* Main Content - Category Cards */}
          <div className="lg:col-span-3 lg:order-last">
            {rootCategoriesWithTags.length === 0 ? (
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <p style={{ color: 'var(--foreground-muted)' }}>
                  아직 등록된 카테고리가 없습니다.
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-3">
                {rootCategoriesWithTags.map((category) => (
                  <CategoryCard
                    key={category.name}
                    name={category.name}
                    count={category.count}
                    tags={category.tags}
                    slugPath={category.slugPath}
                    variant="list"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {rootCategoriesWithTags.map((category) => (
                  <CategoryCard
                    key={category.name}
                    name={category.name}
                    count={category.count}
                    tags={category.tags}
                    slugPath={category.slugPath}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
