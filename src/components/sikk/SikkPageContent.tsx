'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/types';

interface CategoryWithTags {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface SikkPageContentProps {
  rootCategoriesWithTags: CategoryWithTags[];
  recentPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
}

export default function SikkPageContent({
  rootCategoriesWithTags,
  recentPosts,
  categories,
  tags,
}: SikkPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const renderCategoryCards = () => {
    if (rootCategoriesWithTags.length === 0) {
      return (
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          아직 등록된 카테고리가 없습니다.
        </p>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-3">
          {rootCategoriesWithTags.map((category) => (
            <Link
              key={category.name}
              href={`/sikk/category/${category.slugPath.join('/')}`}
              className="block rounded-xl border p-4 transition-all hover:border-pink-400 hover:shadow-md"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {category.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300">
                  {category.count}개
                </span>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {rootCategoriesWithTags.map((category) => (
          <Link
            key={category.name}
            href={`/sikk/category/${category.slugPath.join('/')}`}
            className="group rounded-xl border p-5 transition-all hover:border-pink-400 hover:shadow-lg hover:-translate-y-1"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" style={{ color: 'var(--foreground)' }}>
                {category.name}
              </h3>
              <span className="text-sm px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300">
                {category.count}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {category.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  #{tag}
                </span>
              ))}
              {category.tags.length > 4 && (
                <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                  +{category.tags.length - 4}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400">
                Sikk
              </span>
            </h1>
            <p style={{ color: 'var(--foreground-muted)' }}>
              개인 공부 자료를 정리한 공간입니다
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
                    ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400'
                    : 'hover:bg-gray-100 dark:hover:bg-pink-500/10'
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
                    ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400'
                    : 'hover:bg-gray-100 dark:hover:bg-pink-500/10'
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
            <div className="space-y-6">
              {/* Recent Posts */}
              {recentPosts.length > 0 && (
                <div
                  className="rounded-2xl backdrop-blur-xl border p-5"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    최근 포스트
                  </h3>
                  <ul className="space-y-3">
                    {recentPosts.map((post) => (
                      <li key={post.slug}>
                        <Link
                          href={`/sikk/${post.slug}`}
                          className="block group"
                        >
                          <h4 className="text-sm font-medium line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" style={{ color: 'var(--foreground)' }}>
                            {post.title}
                          </h4>
                          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                            {new Date(post.date).toLocaleDateString('ko-KR')}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div
                  className="rounded-2xl backdrop-blur-xl border p-5"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    태그
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 15).map((tag) => (
                      <Link
                        key={tag.name}
                        href={`/sikk/tag/${encodeURIComponent(tag.name)}`}
                        className="px-2 py-1 text-xs rounded-full transition-all hover:scale-105 border hover:border-pink-400"
                        style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)', borderColor: 'var(--card-border)' }}
                      >
                        #{tag.name}
                        <span className="ml-1 text-pink-500">{tag.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-last">
            <div className="mb-8 pb-4 border-b-2 border-pink-300 dark:border-pink-500">
              <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400">
                카테고리
              </h2>
            </div>
            {renderCategoryCards()}
          </div>
        </div>
      </div>
    </div>
  );
}
