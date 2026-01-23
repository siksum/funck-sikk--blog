import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { checkSikkCategoryAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';

export const revalidate = 10;

interface SharedCategoryPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharedCategoryPageProps) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) {
    return {
      title: '공유된 카테고리를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categoryName) {
    return {
      title: '공유된 카테고리를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  return {
    title: `${accessResult.categoryName} | 공유된 카테고리`,
    robots: { index: false },
  };
}

async function getPostsInCategory(categorySlugPath: string[], includeSubcategories: boolean) {
  // First, get the category by slug path
  let currentCategory = await prisma.sikkCategory.findFirst({
    where: { slug: categorySlugPath[0], parentId: null },
    select: { id: true, name: true, slug: true },
  });

  for (let i = 1; i < categorySlugPath.length; i++) {
    if (!currentCategory) return [];
    currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: categorySlugPath[i], parentId: currentCategory.id },
      select: { id: true, name: true, slug: true },
    });
  }

  if (!currentCategory) return [];

  // Build category path string (using names)
  const buildCategoryPath = async (categoryId: string): Promise<string> => {
    const parts: string[] = [];
    let id: string | null = categoryId;

    while (id) {
      const cat: { name: string; parentId: string | null } | null = await prisma.sikkCategory.findUnique({
        where: { id },
        select: { name: true, parentId: true },
      });
      if (!cat) break;
      parts.unshift(cat.name);
      id = cat.parentId;
    }

    return parts.join('/');
  };

  const categoryPath = await buildCategoryPath(currentCategory.id);

  // Get posts in this category
  const posts = await prisma.sikkPost.findMany({
    where: includeSubcategories
      ? { category: { startsWith: categoryPath } }
      : { category: categoryPath },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      tags: true,
      thumbnail: true,
      date: true,
      status: true,
    },
  });

  return posts;
}

async function getChildCategories(categorySlugPath: string[]) {
  // Get the parent category
  let currentCategory = await prisma.sikkCategory.findFirst({
    where: { slug: categorySlugPath[0], parentId: null },
    select: { id: true },
  });

  for (let i = 1; i < categorySlugPath.length; i++) {
    if (!currentCategory) return [];
    currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: categorySlugPath[i], parentId: currentCategory.id },
      select: { id: true },
    });
  }

  if (!currentCategory) return [];

  // Get child categories
  const children = await prisma.sikkCategory.findMany({
    where: { parentId: currentCategory.id },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Count posts in each child category
  const childrenWithCounts = await Promise.all(
    children.map(async (child) => {
      // Build child category path
      const buildChildPath = async (childId: string): Promise<string> => {
        const parts: string[] = [];
        let id: string | null = childId;

        while (id) {
          const cat: { name: string; parentId: string | null } | null = await prisma.sikkCategory.findUnique({
            where: { id },
            select: { name: true, parentId: true },
          });
          if (!cat) break;
          parts.unshift(cat.name);
          id = cat.parentId;
        }

        return parts.join('/');
      };

      const childPath = await buildChildPath(child.id);
      const count = await prisma.sikkPost.count({
        where: { category: { startsWith: childPath } },
      });

      return {
        ...child,
        count,
        slugPath: [...categorySlugPath, child.slug],
      };
    })
  );

  return childrenWithCounts;
}

export default async function SharedCategoryPage({ params }: SharedCategoryPageProps) {
  const { token } = await params;

  if (!isValidTokenFormat(token)) {
    return <ErrorPage reason="not_found" />;
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return <ErrorPage reason={accessResult.reason || 'not_found'} />;
  }

  // Get share settings for expiration warning
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { publicToken: token },
  });

  const posts = await getPostsInCategory(
    accessResult.categorySlugPath,
    accessResult.includeSubcategories ?? true
  );

  const childCategories = accessResult.includeSubcategories
    ? await getChildCategories(accessResult.categorySlugPath)
    : [];

  // Check if expiring soon (within 7 days)
  const isExpiringSoon =
    share?.publicExpiresAt &&
    new Date(share.publicExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Shared Notice */}
        <div className="mb-8 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-500/40">
          <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="text-sm font-medium">공유된 카테고리</span>
          </div>
          {isExpiringSoon && share?.publicExpiresAt && (
            <p className="mt-2 text-xs text-pink-600 dark:text-pink-400">
              이 링크는{' '}
              {new Date(share.publicExpiresAt).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })}
              에 만료됩니다.
            </p>
          )}
        </div>

        {/* Category Header */}
        <header className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-500 dark:from-pink-300 dark:to-rose-400"
          >
            {accessResult.categoryName}
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            {posts.length}개의 포스트
            {childCategories.length > 0 && ` · ${childCategories.length}개의 하위 카테고리`}
          </p>
        </header>

        {/* Child Categories */}
        {childCategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              하위 카테고리
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childCategories.map((child) => (
                <div
                  key={child.id}
                  className="p-4 rounded-xl border-2 border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                  style={{ background: 'var(--card-bg)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-pink-500 dark:text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {child.name}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {child.count}개의 포스트
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Posts List */}
        {posts.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              포스트
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/sc/${token}/${post.slug}`}
                  className="group block rounded-xl overflow-hidden border-2 border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                  style={{ background: 'var(--card-bg)' }}
                >
                  {/* Thumbnail */}
                  {post.thumbnail && (
                    <div className="relative w-full h-32 overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Status Badge */}
                    {post.status && post.status !== 'not_started' && (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${
                          post.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {post.status === 'completed' ? '완료' : '진행중'}
                      </span>
                    )}

                    <h3
                      className="font-semibold mb-2 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {post.title}
                    </h3>

                    {post.description && (
                      <p
                        className="text-sm line-clamp-2 mb-3"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {post.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      <time dateTime={post.date.toISOString()}>
                        {new Date(post.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      {post.tags.length > 0 && (
                        <span className="text-pink-600 dark:text-pink-400">
                          #{post.tags[0]}
                          {post.tags.length > 1 && ` +${post.tags.length - 1}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12" style={{ color: 'var(--foreground-muted)' }}>
            이 카테고리에 포스트가 없습니다.
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <p className="text-sm text-center" style={{ color: 'var(--foreground-muted)' }}>
            이 카테고리는{' '}
            <span className="font-semibold text-pink-600 dark:text-pink-400">func(sikk)</span>에서
            공유되었습니다.
          </p>
        </footer>
      </div>
    </div>
  );
}

function ErrorPage({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-pink-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {reason === 'expired'
            ? '공유 링크가 만료되었습니다'
            : '공유된 카테고리를 찾을 수 없습니다'}
        </h1>
        <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>
          {reason === 'expired'
            ? '이 공유 링크의 유효 기간이 지났습니다. 공유자에게 새 링크를 요청해 주세요.'
            : '요청하신 공유 링크가 존재하지 않거나 비활성화되었습니다.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
