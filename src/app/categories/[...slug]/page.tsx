import { notFound } from 'next/navigation';
import Link from 'next/link';
import PostList from '@/components/post/PostList';
import CategoryCard from '@/components/category/CategoryCard';
import Sidebar from '@/components/sidebar/Sidebar';
import {
  getCategoryBySlugPath,
  getPostsByCategoryPath,
  getChildCategoriesWithTags,
  getAllCategoriesHierarchical,
  getRecentPosts,
  getAllTags,
  getRootCategories,
} from '@/lib/posts';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = getCategoryBySlugPath(slugPath);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const fullPath = category.path.join(' > ');
  return {
    title: `${fullPath} | func(sikk)`,
    description: `${fullPath} 카테고리의 포스트 목록`,
  };
}

export async function generateStaticParams() {
  const categories = getAllCategoriesHierarchical();

  return categories.map((category) => ({
    slug: category.slugPath,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = getCategoryBySlugPath(slugPath);

  if (!category) {
    notFound();
  }

  const childCategories = getChildCategoriesWithTags(slugPath);
  const directPosts = getPostsByCategoryPath(slugPath, false);
  const allPosts = getPostsByCategoryPath(slugPath, true);

  // Sidebar data
  const recentPosts = getRecentPosts(5);
  const categories = getRootCategories();
  const tags = getAllTags();

  return (
    <div className="min-h-screen blog-page-bg">
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

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            {category.name}
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }} className="mt-2">
            {allPosts.length}개의 포스트
            {childCategories.length > 0 && ` (하위 카테고리 ${childCategories.length}개)`}
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
              currentCategorySlugPath={slugPath}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 lg:order-last">
            {/* Child Categories */}
            {childCategories.length > 0 && (
              <section className="mb-12">
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: 'var(--foreground)' }}
                >
                  하위 카테고리
                </h2>
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
                <PostList posts={directPosts} />
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
