'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';

interface DBSikkSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: { id: string; name: string; slug: string }[];
}

interface SikkSidebarProps {
  categories: Category[];
  tags: { name: string; count: number }[];
  currentCategorySlugPath?: string[];
  sections?: DBSikkSection[];
}

function CategoryTreeItem({
  category,
  depth = 0,
  currentCategorySlugPath,
}: {
  category: Category;
  depth?: number;
  currentCategorySlugPath?: string[];
}) {
  const isCurrentCategory = currentCategorySlugPath &&
    category.slugPath.join('/') === currentCategorySlugPath.join('/');

  const isParentOfCurrent = currentCategorySlugPath &&
    currentCategorySlugPath.length > category.slugPath.length &&
    category.slugPath.every((slug, i) => slug === currentCategorySlugPath[i]);

  const [isExpanded, setIsExpanded] = useState(depth === 0 || isParentOfCurrent);
  const hasChildren = category.children && category.children.length > 0;
  const href = `/sikk/category/${category.slugPath.join('/')}`;

  return (
    <>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 mr-1 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded transition-colors"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            <svg
              className={`w-3 h-3 transition-transform sidebar-text-muted ${isExpanded ? 'rotate-90' : ''}`}
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
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          href={href}
          className={`flex-1 flex items-center justify-between py-1 transition-colors ${
            isCurrentCategory
              ? 'text-pink-600 dark:text-pink-400 font-semibold'
              : 'sidebar-text hover:text-pink-600 dark:hover:text-pink-400'
          }`}
          style={{
            paddingLeft: `${depth * 0.5}rem`,
          }}
        >
          <span>{category.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isCurrentCategory
              ? 'bg-pink-100 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300'
              : 'sidebar-badge'
          }`}>
            {category.count}
          </span>
        </Link>
      </div>
      {hasChildren && isExpanded && (
        <ul className="ml-4 subcategory-divider">
          {category.children!.map((child) => (
            <li key={child.slug}>
              <CategoryTreeItem
                category={child}
                depth={depth + 1}
                currentCategorySlugPath={currentCategorySlugPath}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function SikkSidebar({
  categories,
  tags,
  currentCategorySlugPath,
  sections,
}: SikkSidebarProps) {

  // Group categories by section
  const categoriesBySection = sections && sections.length > 0
    ? (() => {
        const grouped: { section: DBSikkSection | null; categories: Category[] }[] = [];

        // Always show sections, even without categories
        sections.forEach((section) => {
          const sectionCategoryNames = section.categories.map((c) => c.name);
          const sectionCategories = categories.filter((cat) =>
            sectionCategoryNames.includes(cat.name)
          );
          grouped.push({ section, categories: sectionCategories });
        });

        const assignedNames = sections.flatMap((s) => s.categories.map((c) => c.name));
        const uncategorized = categories.filter((cat) => !assignedNames.includes(cat.name));
        if (uncategorized.length > 0) {
          grouped.push({ section: null, categories: uncategorized });
        }

        return grouped;
      })()
    : [{ section: null, categories }];

  return (
    <aside className="space-y-8">
      {/* Categories */}
      <div
        className="rounded-2xl backdrop-blur-xl border-2 border-pink-200 dark:border-pink-500/40 p-5"
        style={{ background: 'var(--card-bg)' }}
      >
        <h3 className="text-lg font-semibold mb-4 text-pink-600 dark:text-pink-400">
          카테고리
        </h3>
        <div className="space-y-4">
          {categoriesBySection.map(({ section, categories: sectionCategories }) => (
            <div key={section?.id || 'uncategorized'}>
              {section && (
                <div className="text-xs font-semibold text-pink-600 dark:text-pink-300 uppercase tracking-wider mb-2 pb-1 border-b border-pink-200 dark:border-pink-500/40">
                  {section.title}
                </div>
              )}
              {sectionCategories.length > 0 ? (
                <ul className="space-y-1">
                  {sectionCategories.map((category) => (
                    <li key={category.slug}>
                      <CategoryTreeItem
                        category={category}
                        currentCategorySlugPath={currentCategorySlugPath}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sidebar-text-muted py-1">카테고리 없음</p>
              )}
            </div>
          ))}
        </div>
        {categories.length > 10 && (
          <Link
            href="/sikk"
            className="block mt-4 text-center text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {/* Tags Cloud */}
      <div
        className="rounded-2xl backdrop-blur-xl border-2 border-pink-200 dark:border-pink-500/40 p-5"
        style={{ background: 'var(--card-bg)' }}
      >
        <h3 className="text-lg font-semibold mb-4 text-pink-600 dark:text-pink-400">
          태그
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <Link
              key={tag.name}
              href={`/sikk/tag/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 text-sm rounded-full transition-all hover:scale-105 border-2 border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
        {tags.length > 15 && (
          <Link
            href="/sikk/tags"
            className="block mt-4 text-center text-sm text-pink-600 dark:text-pink-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>
    </aside>
  );
}
