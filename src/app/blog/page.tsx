import CategoryCard from '@/components/category/CategoryCard';
import Sidebar from '@/components/sidebar/Sidebar';
import { getRecentPosts, getAllTags, getRootCategoriesWithTags, getRootCategories } from '@/lib/posts';

export const metadata = {
  title: '블로그 | func(sikk)',
  description: '모든 블로그 포스트',
};

export default function BlogPage() {
  const recentPosts = getRecentPosts(5);
  const categories = getRootCategories();
  const tags = getAllTags();
  const rootCategoriesWithTags = getRootCategoriesWithTags();

  return (
    <div className="min-h-screen py-12 blog-page-bg">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Page Header */}
        <div className="mb-10">
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

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
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
