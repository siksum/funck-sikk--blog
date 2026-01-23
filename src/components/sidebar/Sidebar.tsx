'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/types';
import PostCard from '@/components/post/PostCard';

interface DBSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: { id: string; name: string; slug: string }[];
}

interface SidebarProps {
  recentPosts: Post[];
  popularPosts: Post[];
  categories: Category[];
  tags: { name: string; count: number }[];
  currentCategorySlugPath?: string[];
  sections?: DBSection[];
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
  // Check if this category or any of its children is the current category
  const isCurrentCategory = currentCategorySlugPath &&
    category.slugPath.join('/') === currentCategorySlugPath.join('/');

  const isParentOfCurrent = currentCategorySlugPath &&
    currentCategorySlugPath.length > category.slugPath.length &&
    category.slugPath.every((slug, i) => slug === currentCategorySlugPath[i]);

  // Auto-expand if this is a parent of the current category
  const [isExpanded, setIsExpanded] = useState(depth === 0 || isParentOfCurrent);
  const hasChildren = category.children && category.children.length > 0;
  const href = `/categories/${category.slugPath.map(s => encodeURIComponent(s)).join('/')}`;

  return (
    <>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 mr-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded transition-colors"
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
              ? 'text-violet-600 dark:text-violet-400 font-semibold'
              : 'sidebar-text hover:text-violet-600 dark:hover:text-violet-400'
          }`}
          style={{
            paddingLeft: `${depth * 0.5}rem`,
          }}
        >
          <span>{category.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isCurrentCategory
              ? 'bg-violet-100 dark:bg-violet-500/30 text-violet-700 dark:text-violet-300'
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

export default function Sidebar({
  recentPosts,
  popularPosts,
  categories,
  tags,
  currentCategorySlugPath,
  sections,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'popular'>('recent');

  // Group categories by section
  const categoriesBySection = sections && sections.length > 0
    ? (() => {
        const grouped: { section: DBSection | null; categories: Category[] }[] = [];

        // Group categories by section (always show sections, even without categories)
        sections.forEach((section) => {
          const sectionCategoryNames = section.categories.map((c) => c.name);
          // Find matching categories from posts OR create placeholder for section categories
          const sectionCategories: Category[] = section.categories.map((dbCat) => {
            // Try to find existing category with posts
            const existingCat = categories.find((cat) => cat.name === dbCat.name);
            if (existingCat) {
              return existingCat;
            }
            // Create placeholder category for categories without posts
            return {
              name: dbCat.name,
              slug: dbCat.slug,
              count: 0,
              path: [dbCat.name],
              slugPath: [dbCat.slug],
              depth: 0,
            };
          });
          grouped.push({ section, categories: sectionCategories });
        });

        // Add categories without section
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
      {/* Categories - First */}
      <div
        className="rounded-2xl backdrop-blur-xl border p-5"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h3 className="text-lg font-semibold mb-4 sidebar-title">
          카테고리
        </h3>
        <div className="space-y-4">
          {categoriesBySection.map(({ section, categories: sectionCategories }) => (
            <div key={section?.id || 'uncategorized'}>
              {section && (
                <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2 pb-1 border-b border-violet-300 dark:border-violet-400">
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
            href="/blog"
            className="block mt-4 text-center text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {/* Posts Tabs - Recent/Popular */}
      <div
        className="rounded-2xl overflow-hidden backdrop-blur-xl border"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'recent'
                ? 'text-violet-400 dark:text-violet-300 border-b-2 border-violet-400 dark:border-violet-300 -mb-px'
                : 'sidebar-text'
            }`}
          >
            최신 글
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'popular'
                ? 'text-violet-400 dark:text-violet-300 border-b-2 border-violet-400 dark:border-violet-300 -mb-px'
                : 'sidebar-text'
            }`}
          >
            인기 글
          </button>
        </div>

        {/* Tab Content */}
        <div className="sidebar-divider-simple">
          {(activeTab === 'recent' ? recentPosts : popularPosts).map((post) => (
            <PostCard key={post.slug} post={post} variant="compact" />
          ))}
          {(activeTab === 'recent' ? recentPosts : popularPosts).length ===
            0 && (
            <p className="p-4 text-center text-sm sidebar-text-muted">
              포스트가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Tags Cloud */}
      <div
        className="rounded-2xl backdrop-blur-xl border p-5"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h3 className="text-lg font-semibold mb-4 sidebar-title">
          태그
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className="px-3 py-1 text-sm rounded-full transition-all hover:scale-105 border hover:border-violet-400 sidebar-tag"
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
