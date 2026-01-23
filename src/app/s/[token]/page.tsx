import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { checkSikkPostAccessByToken } from '@/lib/sikk-access';
import { getSikkPostBySlugAsync, getRelatedSikkPostsAsync } from '@/lib/sikk';
import MDXContent from '@/components/mdx/MDXContent';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import FloatingActions from '@/components/blog/FloatingActions';

export const revalidate = 10;

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

interface SharedTokenPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharedTokenPageProps) {
  const { token } = await params;
  const accessResult = await checkSikkPostAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.slug) {
    return {
      title: '공유된 페이지를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  const post = await getSikkPostBySlugAsync(accessResult.slug);

  if (!post) {
    return {
      title: '공유된 페이지를 찾을 수 없습니다',
      robots: { index: false },
    };
  }

  return {
    title: `${post.title} | 공유된 포스트`,
    description: post.description,
    robots: { index: false }, // Don't index shared pages
  };
}

export default async function SharedTokenPage({ params }: SharedTokenPageProps) {
  const { token } = await params;
  const accessResult = await checkSikkPostAccessByToken(token);

  if (!accessResult.canAccess || !accessResult.slug) {
    // Show appropriate error page
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
            {accessResult.reason === 'expired'
              ? '공유 링크가 만료되었습니다'
              : '공유된 페이지를 찾을 수 없습니다'}
          </h1>
          <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>
            {accessResult.reason === 'expired'
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

  const post = await getSikkPostBySlugAsync(accessResult.slug);

  if (!post) {
    notFound();
  }

  // Get share settings to show expiration warning
  const share = await prisma.sikkPostShare.findUnique({
    where: { publicToken: token },
  });

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readingTime = calculateReadingTime(post.content);
  const relatedPosts = await getRelatedSikkPostsAsync(post.slug, 3);
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
              <div className="relative w-full h-48 sm:h-64 md:h-80">
                <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <DifficultyBadge level={difficulty} />
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
              <time dateTime={post.date}>{formattedDate}</time>
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

          {/* Related Posts - only show public ones with tokens */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6 text-pink-600 dark:text-pink-400">
                관련 포스트
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts
                  .filter((p) => p.isPublic)
                  .map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/share/sikk/${relatedPost.slug}`}
                      className="block p-4 rounded-xl border-2 border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                      style={{ background: 'var(--card-bg)' }}
                    >
                      <h3 className="font-semibold mb-2 text-pink-600 dark:text-pink-400 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p
                        className="text-sm line-clamp-2"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {relatedPost.description}
                      </p>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <p className="text-sm text-center" style={{ color: 'var(--foreground-muted)' }}>
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
