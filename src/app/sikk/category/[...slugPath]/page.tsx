import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllSikkPostsAsync, getSikkRootCategoriesAsync } from '@/lib/sikk';
import { auth } from '@/lib/auth';

export const revalidate = 10;

interface CategoryPageProps {
  params: Promise<{ slugPath: string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slugPath } = await params;
  const categoryName = decodeURIComponent(slugPath[slugPath.length - 1]);

  return {
    title: `${categoryName} | Sikk`,
    description: `${categoryName} 카테고리의 포스트 목록`,
  };
}

export default async function SikkCategoryPage({ params }: CategoryPageProps) {
  // Check admin access - Sikk is admin-only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const { slugPath } = await params;
  const decodedSlugPath = slugPath.map((s) => decodeURIComponent(s));

  // Get all posts and filter by category path
  const allPosts = await getAllSikkPostsAsync();

  // Filter posts that match the category slug path
  const posts = allPosts.filter((post) => {
    // Check if the post's categorySlugPath starts with the requested slugPath
    if (post.categorySlugPath.length < decodedSlugPath.length) return false;
    return decodedSlugPath.every((slug, index) => post.categorySlugPath[index] === slug);
  });

  if (posts.length === 0) {
    notFound();
  }

  // Get the category name from the first post
  const categoryName = posts[0].categoryPath[decodedSlugPath.length - 1] || decodedSlugPath[decodedSlugPath.length - 1];
  const fullCategoryPath = posts[0].categoryPath.slice(0, decodedSlugPath.length);

  return (
    <div className="min-h-screen py-12">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm mb-8" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            Sikk
          </Link>
          {fullCategoryPath.map((cat, index) => (
            <span key={index} className="flex items-center">
              <span className="mx-2">/</span>
              {index === fullCategoryPath.length - 1 ? (
                <span className="text-pink-600 dark:text-pink-400">{cat}</span>
              ) : (
                <Link
                  href={`/sikk/category/${decodedSlugPath.slice(0, index + 1).join('/')}`}
                  className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                >
                  {cat}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400"
          >
            {categoryName}
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            {posts.length}개의 포스트
          </p>
          <div className="mt-4 border-b-2 border-pink-300 dark:border-pink-500" />
        </header>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.slug} href={`/sikk/${post.slug}`} className="block group">
              <article
                className="p-5 rounded-xl border-2 border-pink-200 dark:border-pink-500/40
                  hover:border-pink-400 dark:hover:border-pink-400 transition-all duration-300
                  hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] dark:hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                style={{ background: 'var(--card-bg)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-lg font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors line-clamp-1"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {post.title}
                    </h2>
                    {post.description && (
                      <p
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {post.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full border border-pink-200 dark:border-pink-500/50
                                bg-pink-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-gray-500 dark:text-zinc-400">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Back Link */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href="/sikk"
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Sikk 목록으로 돌아가기
          </Link>
        </footer>
      </div>
    </div>
  );
}
