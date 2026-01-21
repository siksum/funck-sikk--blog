'use client';

import { useState, useMemo } from 'react';
import { Post, Category } from '@/types';
import CategoryCard from '@/components/category/CategoryCard';
import Sidebar from '@/components/sidebar/Sidebar';

interface CategoryWithTags {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
}

interface DBSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: DBCategory[];
}

interface BlogPageContentProps {
  rootCategoriesWithTags: CategoryWithTags[];
  recentPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
  sections: DBSection[];
}

// Fallback config for when no sections are configured in DB
const FALLBACK_SECTION_CONFIG = [
  {
    title: 'Web2 Security',
    description: '전통적인 웹 보안 및 시스템 해킹',
    categoryNames: ['Wargame', 'Web Development'],
  },
  {
    title: 'Web3 Security',
    description: '블록체인 및 스마트 컨트랙트 보안',
    categoryNames: ['Programming'],
  },
  {
    title: 'TIL',
    description: 'Today I Learned - 오늘 배운 것들',
    categoryNames: ['1'],
  },
];

export default function BlogPageContent({
  rootCategoriesWithTags,
  recentPosts,
  categories,
  tags,
  sections,
}: BlogPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const groupedCategories = useMemo(() => {
    // If we have DB sections with categories assigned, use them
    if (sections && sections.length > 0) {
      return sections.map((section) => {
        // Get category names from DB section
        const categoryNames = section.categories.map((c) => c.name);
        // Find matching categories from posts
        const sectionCategories = rootCategoriesWithTags.filter(
          (cat) => categoryNames.includes(cat.name)
        );
        return {
          section: {
            title: section.title,
            description: section.description || '',
            categoryNames,
          },
          categories: sectionCategories,
        };
      });
    }

    // Fallback to hardcoded config if no DB sections
    return FALLBACK_SECTION_CONFIG.map((section) => {
      const sectionCategories = rootCategoriesWithTags.filter(
        (cat) => section.categoryNames.includes(cat.name)
      );
      return { section, categories: sectionCategories };
    });
  }, [rootCategoriesWithTags, sections]);

  const renderCategoryCards = (sectionCategories: CategoryWithTags[]) => {
    if (sectionCategories.length === 0) {
      return (
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
          아직 등록된 카테고리가 없습니다.
        </p>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-3">
          {sectionCategories.map((category) => (
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
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sectionCategories.map((category) => (
          <CategoryCard
            key={category.name}
            name={category.name}
            count={category.count}
            tags={category.tags}
            slugPath={category.slugPath}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-12">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Page Header with View Toggle */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <h1
              className="text-4xl md:text-5xl font-bold"
              style={{ color: 'var(--foreground)' }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-300 dark:to-indigo-400">
                Blog
              </span>
            </h1>

            {/* View Toggle */}
            {rootCategoriesWithTags.length > 0 && (
              <div
                className="inline-flex rounded-lg p-1 border shrink-0"
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
          <p className="mt-4" style={{ color: 'var(--foreground-muted)' }}>
            카테고리별로 정리된 개발 기록을 탐색해보세요
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
          {/* Sidebar - Left */}
          <div className="mb-8 lg:mb-0 lg:col-span-1 lg:order-first">
            <Sidebar
              recentPosts={recentPosts}
              popularPosts={recentPosts}
              categories={categories}
              tags={tags}
              sections={sections}
            />
          </div>

          {/* Main Content - Category Sections */}
          <div className="lg:col-span-3 lg:order-last space-y-16">
            {groupedCategories.map(({ section, categories: sectionCategories }) => (
              <section key={section.title}>
                <div className="mb-8 pb-4 border-b-2 border-violet-300 dark:border-violet-500">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-300 dark:to-indigo-400">
                    {section.title}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {section.description}
                  </p>
                </div>
                {renderCategoryCards(sectionCategories)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
