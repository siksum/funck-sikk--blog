'use client';

import { useState, useMemo } from 'react';
import { Post, Category } from '@/types';
import SikkCategoryCard from '@/components/sikk/SikkCategoryCard';
import SikkSidebar from '@/components/sikk/SikkSidebar';

interface CategoryWithTags {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface DBSikkCategory {
  id: string;
  name: string;
  slug: string;
}

interface DBSikkSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: DBSikkCategory[];
}

interface SikkPageContentProps {
  rootCategoriesWithTags: CategoryWithTags[];
  recentPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
  sections: DBSikkSection[];
}

// Fallback config for when no sections are configured in DB
const FALLBACK_SECTION_CONFIG = [
  {
    title: '학습 자료',
    description: '개인 학습 및 공부 자료',
    categoryNames: [] as string[],
  },
];

export default function SikkPageContent({
  rootCategoriesWithTags,
  recentPosts,
  categories,
  tags,
  sections,
}: SikkPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const groupedCategories = useMemo(() => {
    // If we have DB sections with categories assigned, use them
    if (sections && sections.length > 0) {
      return sections.map((section) => {
        const categoryNames = section.categories.map((c) => c.name);
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

    // Fallback: show all categories in a single section
    return [{
      section: {
        title: '카테고리',
        description: '',
        categoryNames: rootCategoriesWithTags.map(c => c.name),
      },
      categories: rootCategoriesWithTags,
    }];
  }, [rootCategoriesWithTags, sections]);

  const renderCategoryCards = (sectionCategories: CategoryWithTags[]) => {
    if (viewMode === 'list') {
      return (
        <div className="space-y-3">
          {sectionCategories.map((category) => (
            <SikkCategoryCard
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
          <SikkCategoryCard
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
              className="inline-flex rounded-lg p-1 border-2 border-pink-200 dark:border-pink-500/40"
              style={{ background: 'var(--card-bg)' }}
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
            <SikkSidebar
              categories={categories}
              tags={tags}
              sections={sections}
            />
          </div>

          {/* Main Content - Category Sections */}
          <div className="lg:col-span-3 lg:order-last space-y-16">
            {groupedCategories.map(({ section, categories: sectionCategories }) => (
              <section key={section.title}>
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                      {section.description}
                    </p>
                  )}
                  {sectionCategories.length === 0 && (
                    <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                      아직 등록된 카테고리가 없습니다.
                    </p>
                  )}
                  <div className="border-b-2 border-pink-300 dark:border-pink-500" />
                </div>
                {sectionCategories.length > 0 && renderCategoryCards(sectionCategories)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
