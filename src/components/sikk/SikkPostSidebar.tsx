'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/types';
import TableOfContents from '@/components/blog/TableOfContents';

interface SikkPostSidebarProps {
  content: string;
  tags: string[];
  category: string;
  relatedPosts: Post[];
  categories: Category[];
  currentCategorySlugPath?: string[];
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
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: 'var(--foreground-muted)' }}
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
          className={`flex-1 flex items-center justify-between py-1 text-sm transition-colors ${
            isCurrentCategory
              ? 'text-pink-600 dark:text-pink-400 font-semibold'
              : 'hover:text-pink-600 dark:hover:text-pink-400'
          }`}
          style={{
            paddingLeft: `${depth * 0.5}rem`,
            color: isCurrentCategory ? undefined : 'var(--foreground)',
          }}
        >
          <span>{category.name}</span>
          <span className={`text-sm px-1.5 py-0.5 rounded-full ${
            isCurrentCategory
              ? 'bg-pink-100 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300'
              : ''
          }`}
          style={{
            background: isCurrentCategory ? undefined : 'var(--tag-bg)',
            color: isCurrentCategory ? undefined : 'var(--foreground-muted)'
          }}
          >
            {category.count}
          </span>
        </Link>
      </div>
      {hasChildren && isExpanded && (
        <ul className="ml-4 border-l" style={{ borderColor: 'var(--card-border)' }}>
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

export default function SikkPostSidebar({
  content,
  tags,
  category,
  relatedPosts,
  categories,
  currentCategorySlugPath,
}: SikkPostSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Table of Contents */}
      <div
        className="rounded-2xl backdrop-blur-xl border p-5"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          목차
        </h3>
        <TableOfContents content={content} variant="sidebar" />
      </div>

      {/* Category */}
      <div
        className="rounded-2xl backdrop-blur-xl border p-5"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
          카테고리
        </h3>
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <CategoryTreeItem
                category={cat}
                currentCategorySlugPath={currentCategorySlugPath}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border p-5"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            태그
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/sikk/tag/${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 text-sm rounded-full transition-all hover:scale-105 border hover:border-pink-400"
                style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)', borderColor: 'var(--card-border)' }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div
          className="rounded-2xl backdrop-blur-xl border p-5"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            관련 포스트
          </h3>
          <ul className="divide-y divide-pink-200 dark:divide-pink-500/30">
            {relatedPosts.slice(0, 3).map((post, index) => (
              <li key={post.slug} className={index === 0 ? 'pb-3' : 'py-3'}>
                <Link
                  href={`/sikk/${post.slug}`}
                  className="block group"
                >
                  <h4
                    className="text-sm font-medium line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {post.title}
                  </h4>
                  <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {post.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
