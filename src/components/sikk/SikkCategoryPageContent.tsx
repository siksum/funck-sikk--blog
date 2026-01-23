'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Post, Category } from '@/types';
import SikkCategoryCard from '@/components/sikk/SikkCategoryCard';
import SikkDatabaseCard from '@/components/sikk/SikkDatabaseCard';
import SikkSidebar from '@/components/sikk/SikkSidebar';
import SikkPostCard from '@/components/sikk/SikkPostCard';
import CategoryShareModal from '@/components/sikk/CategoryShareModal';

interface ChildCategory {
  name: string;
  count: number;
  tags: string[];
  slugPath: string[];
}

interface DBSikkSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: { id: string; name: string; slug: string; slugPath: string[]; path: string[] }[];
}

interface SikkDatabase {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string | null;
  _count: {
    items: number;
  };
}

interface SikkCategoryPageContentProps {
  category: {
    name: string;
    path: string[];
    slugPath: string[];
  };
  childCategories: ChildCategory[];
  directPosts: Post[];
  allPostsCount: number;
  categories: Category[];
  tags: { name: string; count: number }[];
  sections?: DBSikkSection[];
  databases?: SikkDatabase[];
  isAdmin?: boolean;
}

export default function SikkCategoryPageContent({
  category,
  childCategories,
  directPosts,
  allPostsCount,
  categories,
  tags,
  sections,
  databases = [],
  isAdmin = false,
}: SikkCategoryPageContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = directPosts;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(term) ||
          post.description?.toLowerCase().includes(term) ||
          post.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        comparison = a.title.localeCompare(b.title, 'ko');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [directPosts, searchTerm, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: 'date' | 'title') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'date' ? 'desc' : 'asc');
    }
  };

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
                href="/sikk"
                className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              >
                Sikk
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
                    href={`/sikk/categories/${category.slugPath.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
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

        {/* Grid Layout */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
          {/* Sidebar - Left */}
          <div className="mb-8 lg:mb-0 lg:col-span-1 lg:order-first">
            <SikkSidebar
              categories={categories}
              tags={tags}
              currentCategorySlugPath={category.slugPath}
              sections={sections}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-last">
            {/* Category Header - Always show */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-pink-300 dark:border-pink-500">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400">
                  {category.name}
                </h2>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  {childCategories.length > 0
                    ? `${allPostsCount}개의 포스트 (하위 카테고리 ${childCategories.length}개)`
                    : databases.length > 0
                    ? `${databases.length}개의 데이터베이스`
                    : directPosts.length > 0
                    ? `${directPosts.length}개의 포스트`
                    : '콘텐츠 없음'}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Share Button (Admin Only) */}
                {isAdmin && (
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 rounded-lg border border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                    style={{ background: 'var(--card-bg)', color: 'var(--foreground-muted)' }}
                    title="카테고리 공유"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                )}

                {/* View Toggle */}
                <div
                  className="inline-flex rounded-lg p-1 border border-pink-200 dark:border-pink-500/40"
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
              </div>
            </div>

            {/* Child Categories */}
            {childCategories.length > 0 && (
              <section className="mb-12">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  하위 카테고리
                </h3>
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {childCategories.map((child) => (
                      <SikkCategoryCard
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
                      <SikkCategoryCard
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

            {/* Databases in this category */}
            {databases.length > 0 && (
              <section className="mb-12">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  데이터베이스
                </h3>
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {databases.map((db) => (
                      <SikkDatabaseCard
                        key={db.id}
                        id={db.id}
                        title={db.title}
                        description={db.description}
                        slug={db.slug}
                        itemCount={db._count.items}
                        categorySlugPath={category.slugPath}
                        variant="list"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {databases.map((db) => (
                      <SikkDatabaseCard
                        key={db.id}
                        id={db.id}
                        title={db.title}
                        description={db.description}
                        slug={db.slug}
                        itemCount={db._count.items}
                        categorySlugPath={category.slugPath}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Posts in this category */}
            {directPosts.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  포스트 ({searchTerm ? `${filteredAndSortedPosts.length}/${directPosts.length}` : directPosts.length})
                </h3>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="제목, 설명, 태그로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 text-sm rounded-lg border border-pink-200 dark:border-pink-500/40 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
                      style={{
                        background: 'var(--card-bg)',
                        color: 'var(--foreground)',
                      }}
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--foreground-muted)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Sort Buttons */}
                  <div
                    className="inline-flex rounded-lg p-1 border border-pink-200 dark:border-pink-500/40"
                    style={{ background: 'var(--card-bg)' }}
                  >
                    <button
                      onClick={() => handleSortChange('date')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                        sortBy === 'date'
                          ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400'
                          : 'hover:bg-gray-100 dark:hover:bg-pink-500/10'
                      }`}
                      style={{ color: sortBy === 'date' ? undefined : 'var(--foreground-muted)' }}
                    >
                      날짜
                      {sortBy === 'date' && (
                        <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('title')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                        sortBy === 'title'
                          ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400'
                          : 'hover:bg-gray-100 dark:hover:bg-pink-500/10'
                      }`}
                      style={{ color: sortBy === 'title' ? undefined : 'var(--foreground-muted)' }}
                    >
                      제목
                      {sortBy === 'title' && (
                        <span className="text-pink-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {filteredAndSortedPosts.length === 0 ? (
                  <p
                    className="text-center py-12"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    검색 결과가 없습니다.
                  </p>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {filteredAndSortedPosts.map((post) => (
                      <SikkPostCard key={post.slug} post={post} variant="list" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedPosts.map((post) => (
                      <SikkPostCard key={post.slug} post={post} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {directPosts.length === 0 && childCategories.length === 0 && databases.length === 0 && (
              <p
                className="text-center py-12"
                style={{ color: 'var(--foreground-muted)' }}
              >
                이 카테고리에 콘텐츠가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Share Modal */}
      {isAdmin && (
        <CategoryShareModal
          slugPath={category.slugPath}
          categoryName={category.name}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
