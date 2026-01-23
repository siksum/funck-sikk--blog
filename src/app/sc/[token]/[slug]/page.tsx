import { notFound } from 'next/navigation';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/db';
import { checkSikkCategoryAccessByToken } from '@/lib/sikk-access';
import { isValidTokenFormat } from '@/lib/token';
import MDXContent from '@/components/mdx/MDXContent';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import FloatingActions from '@/components/blog/FloatingActions';

export const dynamic = 'force-dynamic';

interface SharedCategoryPostPageProps {
  params: Promise<{ token: string; slug: string }>;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function estimateDifficulty(content: string, tags: string[]): 'beginner' | 'intermediate' | 'advanced' {
  const words = content.trim().split(/\s+/).length;
  const advancedTags = ['exploit', 'pwn', 'reverse', 'advanced', 'deep-dive'];
  const beginnerTags = ['tutorial', 'beginner', 'intro', 'basic', '입문'];

  if (tags.some((tag) => advancedTags.includes(tag.toLowerCase())) || words > 3000) {
    return 'advanced';
  }
  if (tags.some((tag) => beginnerTags.includes(tag.toLowerCase())) || words < 1000) {
    return 'beginner';
  }
  return 'intermediate';
}

export async function generateMetadata({ params }: SharedCategoryPostPageProps) {
  const { token, slug } = await params;

  if (!isValidTokenFormat(token)) {
    return {
      title: '공유된 페이지를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return {
      title: '공유된 페이지를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const post = await prisma.sikkPost.findUnique({
    where: { slug },
    select: { title: true, description: true, category: true },
  });

  if (!post) {
    return {
      title: '공유된 페이지를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  return {
    title: `${post.title} | 공유된 포스트`,
    description: post.description,
    robots: { index: false },
  };
}

export default async function SharedCategoryPostPage({ params }: SharedCategoryPostPageProps) {
  const { token, slug } = await params;

  if (!isValidTokenFormat(token)) {
    return <ErrorPage reason="not_found" />;
  }

  const accessResult = await checkSikkCategoryAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.categorySlugPath) {
    return <ErrorPage reason={accessResult.reason || 'not_found'} />;
  }

  // Get the post
  const post = await prisma.sikkPost.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      content: true,
      category: true,
      tags: true,
      thumbnail: true,
      thumbnailPosition: true,
      thumbnailScale: true,
      date: true,
      status: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Build category path for validation
  const buildCategoryPath = async (categorySlugPath: string[]): Promise<string | null> => {
    let currentCategory = await prisma.sikkCategory.findFirst({
      where: { slug: categorySlugPath[0], parentId: null },
      select: { id: true, name: true },
    });

    const names: string[] = [];
    if (currentCategory) {
      names.push(currentCategory.name);
    }

    for (let i = 1; i < categorySlugPath.length; i++) {
      if (!currentCategory) return null;
      currentCategory = await prisma.sikkCategory.findFirst({
        where: { slug: categorySlugPath[i], parentId: currentCategory.id },
        select: { id: true, name: true },
      });
      if (currentCategory) {
        names.push(currentCategory.name);
      }
    }

    return names.join('/');
  };

  const sharedCategoryPath = await buildCategoryPath(accessResult.categorySlugPath);

  // Verify post belongs to the shared category
  if (sharedCategoryPath && post.category) {
    const isInCategory = accessResult.includeSubcategories
      ? post.category.startsWith(sharedCategoryPath)
      : post.category === sharedCategoryPath;

    if (!isInCategory) {
      return <ErrorPage reason="not_found" />;
    }
  } else if (!post.category || !sharedCategoryPath) {
    return <ErrorPage reason="not_found" />;
  }

  // Get share settings for expiration warning
  const share = await prisma.sikkCategoryShare.findUnique({
    where: { publicToken: token },
  });

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readingTime = calculateReadingTime(post.content);
  const difficulty = estimateDifficulty(post.content, post.tags);

  // Check if expiring soon (within 7 days)
  const isExpiringSoon =
    share?.publicExpiresAt &&
    new Date(share.publicExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <>
      <ReadingProgressBar readingTime={readingTime} />
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Shared Notice */}
          <div className="mb-8 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-500/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="text-sm font-medium">공유된 포스트</span>
              </div>
              <Link
                href={`/sc/${token}`}
                className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                목록으로
              </Link>
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

          {/* Banner Image */}
          {post.thumbnail && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <div
                className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-200 dark:bg-gray-700"
                style={{
                  backgroundImage: `url(${post.thumbnail})`,
                  backgroundSize: `${post.thumbnailScale || 100}%`,
                  backgroundPosition: `center ${post.thumbnailPosition || 50}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <DifficultyBadge level={difficulty} />
              {post.status && post.status !== 'not_started' && (
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    post.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  }`}
                >
                  {post.status === 'completed' ? '완료' : '진행중'}
                </span>
              )}
            </div>

            <h1
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--foreground)' }}
            >
              {post.title}
            </h1>

            <p className="text-lg mb-6" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              {post.description}
            </p>

            <div
              className="flex flex-wrap items-center gap-4 text-sm mb-6"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
              <time dateTime={post.date.toISOString()}>{formattedDate}</time>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {readingTime}분 읽기
              </span>
              {post.category && (
                <span className="px-2 py-1 rounded bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300">
                  {post.category}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-sm rounded border border-pink-200 dark:border-pink-500/40 text-pink-600 dark:text-pink-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          {/* Pink Divider */}
          <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

          {/* Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent content={post.content} />
          </article>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex items-center justify-between">
              <Link
                href={`/sc/${token}`}
                className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {accessResult.categoryName} 목록으로 돌아가기
              </Link>
            </div>
            <p className="text-sm text-center mt-8" style={{ color: 'var(--foreground-muted)' }}>
              이 포스트는{' '}
              <span className="font-semibold text-pink-600 dark:text-pink-400">func(sikk)</span>에서
              공유되었습니다.
            </p>
          </footer>
        </div>
      </div>
      <FloatingActions />
    </>
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
            : '공유된 페이지를 찾을 수 없습니다'}
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
