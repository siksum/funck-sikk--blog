import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSikkPostBySlugAsync, getAllSikkPostsAsync, getRelatedSikkPostsAsync } from '@/lib/sikk';
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

interface SharedSikkPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SharedSikkPostPageProps) {
  const { slug } = await params;
  const post = await getSikkPostBySlugAsync(slug);

  if (!post || !post.isPublic) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Sikk`,
    description: post.description,
  };
}

export async function generateStaticParams() {
  const posts = await getAllSikkPostsAsync();

  // Only generate static params for public posts
  return posts
    .filter((post) => post.isPublic)
    .map((post) => ({
      slug: post.slug,
    }));
}

export default async function SharedSikkPostPage({ params }: SharedSikkPostPageProps) {
  const { slug } = await params;
  const post = await getSikkPostBySlugAsync(slug);

  // Only show posts marked as public
  if (!post || !post.isPublic) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readingTime = calculateReadingTime(post.content);
  const relatedPosts = await getRelatedSikkPostsAsync(slug, 3);
  const difficulty = estimateDifficulty(post.content, post.tags);

  return (
    <>
      <ReadingProgressBar readingTime={readingTime} />
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Shared Notice */}
          <div className="mb-8 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-500/40">
            <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium">공유된 포스트</span>
            </div>
          </div>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <DifficultyBadge level={difficulty} />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>

            <p className="text-lg mb-6" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              <time dateTime={post.date}>{formattedDate}</time>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6 text-pink-600 dark:text-pink-400">
                관련 포스트
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.filter(p => p.isPublic).map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/share/sikk/${relatedPost.slug}`}
                    className="block p-4 rounded-xl border-2 border-pink-200 dark:border-pink-500/40 hover:border-pink-400 dark:hover:border-pink-400 transition-colors"
                    style={{ background: 'var(--card-bg)' }}
                  >
                    <h3 className="font-semibold mb-2 text-pink-600 dark:text-pink-400 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--foreground-muted)' }}>
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
              이 포스트는 <span className="font-semibold text-pink-600 dark:text-pink-400">func(sikk)</span>에서 공유되었습니다.
            </p>
          </footer>
        </div>
      </div>
      <FloatingActions />
    </>
  );
}
