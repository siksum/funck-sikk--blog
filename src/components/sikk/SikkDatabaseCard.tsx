'use client';

import Link from 'next/link';

interface SikkDatabaseCardProps {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  itemCount: number;
  categorySlugPath?: string[];
  variant?: 'card' | 'list';
}

// Database icon
const databaseIcon = (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>
);

// Colors for database cards (pink theme for sikk)
const colors = {
  iconBg: 'bg-pink-500',
  neonBorder: 'border-pink-300 dark:border-pink-500/60',
  neonGlow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] dark:hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]',
};

export default function SikkDatabaseCard({
  title,
  description,
  slug,
  itemCount,
  categorySlugPath,
  variant = 'card',
}: SikkDatabaseCardProps) {
  // New URL format: /sikk/categories/[...categoryPath]/db/[slug]
  const href = categorySlugPath && categorySlugPath.length > 0
    ? `/sikk/categories/${categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/db/${encodeURIComponent(slug)}`
    : `/sikk/categories/uncategorized/db/${encodeURIComponent(slug)}`;

  // List variant
  if (variant === 'list') {
    return (
      <Link href={href} className="block group">
        <article
          className={`relative rounded-xl overflow-hidden transition-all duration-300
            border ${colors.neonBorder} category-card
            hover:border-pink-400 dark:hover:border-pink-400`}
          style={{ background: 'var(--card-bg)' }}
        >
          <div className="relative p-4 flex items-center gap-4">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0
                ${colors.iconBg} shadow-md group-hover:scale-105 transition-transform`}
            >
              {databaseIcon}
            </div>

            {/* Title and Count */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="text-sm font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {title}
                </h3>
                <span className="px-1.5 py-0.5 text-xs rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                  DB
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {itemCount}개의 항목
              </p>
            </div>

            {/* Description - condensed */}
            {description && (
              <p
                className="hidden sm:block text-xs max-w-[200px] line-clamp-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {description}
              </p>
            )}

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </article>
      </Link>
    );
  }

  // Card variant (default)
  return (
    <Link href={href} className="block group h-full">
      <article
        className={`relative rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col
          border-2 ${colors.neonBorder} ${colors.neonGlow} category-card
          hover:-translate-y-1`}
        style={{ background: 'var(--card-bg)' }}
      >
        {/* Content with Icon */}
        <div className="relative p-5 flex-1 flex flex-col">
          {/* Icon and Title Row */}
          <div className="flex items-start gap-4 mb-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0
                ${colors.iconBg} shadow-lg group-hover:scale-110 transition-transform`}
            >
              {databaseIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="text-base font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {title}
                </h3>
                <span className="px-1.5 py-0.5 text-xs rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400">
                  DB
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                {itemCount}개의 항목
              </p>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p
              className="text-sm line-clamp-2"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
