'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/types';
import CategoryCard from '@/components/category/CategoryCard';
import Sidebar from '@/components/sidebar/Sidebar';
import PostCard from '@/components/post/PostCard';

interface ChildCategory {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface CategoryPageContentProps {
  category: {
    name: string;
    path: string[];
    slugPath: string[];
  };
  childCategories: ChildCategory[];
  directPosts: Post[];
  allPostsCount: number;
  recentPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
}

export default function CategoryPageContent({
  category,
  childCategories,
  directPosts,
  allPostsCount,
  recentPosts,
  categories,
  tags,
}: CategoryPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol
            className="flex items-center gap-2 text-sm flex-wrap"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <li>
              <Link
                href="/blog"
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                Blog
              </Link>
            </li>
            {category.path.map((name, index) => (
              <li key={index} className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {index < category.path.length - 1 ? (
                  <Link
                    href={`/categories/${category.slugPath.slice(0, index + 1).join('/')}`}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {name}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--foreground)' }}>{name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header with View Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: 'var(--foreground)' }}
            >
              {category.name}
            </h1>
            <p style={{ color: 'var(--foreground-muted)' }} className="mt-2">
              {allPostsCount}개의 포스트
              {childCategories.length > 0 && ` (하위 카테고리 ${childCategories.length}개)`}
            </p>
          </div>

          {/* View Toggle - show if there are direct posts or child categories */}
          {(directPosts.length > 0 || childCategories.length > 0) && (
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

        {/* Grid Layout */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
          {/* Sidebar - Left */}
          <div className="mb-8 lg:mb-0 lg:col-span-1 lg:order-first">
            <Sidebar
              recentPosts={recentPosts}
              popularPosts={recentPosts}
              categories={categories}
              tags={tags}
              currentCategorySlugPath={category.slugPath}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-last">
            {/* Child Categories */}
            {childCategories.length > 0 && (
              <section className="mb-12">
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {childCategories.map((child) => (
                      <CategoryCard
                        key={child.name}
                        name={child.name}
                        count={child.count}
                        tags={child.tags}
                        slugPath={child.slugPath}
                        variant="list"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {childCategories.map((child) => (
                      <CategoryCard
                        key={child.name}
                        name={child.name}
                        count={child.count}
                        tags={child.tags}
                        slugPath={child.slugPath}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Posts in this category */}
            {directPosts.length > 0 && (
              <section>
                {childCategories.length > 0 && (
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {category.name} 포스트
                  </h2>
                )}
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {directPosts.map((post) => (
                      <PostCard key={post.slug} post={post} variant="list" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {directPosts.map((post) => (
                      <PostCard key={post.slug} post={post} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {directPosts.length === 0 && childCategories.length === 0 && (
              <p
                className="text-center py-12"
                style={{ color: 'var(--foreground-muted)' }}
              >
                이 카테고리에 포스트가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
