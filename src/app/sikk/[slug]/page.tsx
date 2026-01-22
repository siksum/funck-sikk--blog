import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSikkPostBySlugAsync, getAllSikkPostsAsync, getRelatedSikkPostsAsync, getAdjacentSikkPostsAsync, getSikkRootCategoriesAsync, getSikkSectionsAsync } from '@/lib/sikk';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import PostNavigation from '@/components/blog/PostNavigation';
import FloatingActions from '@/components/blog/FloatingActions';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import SikkPostLayout from '@/components/sikk/SikkPostLayout';
import SikkPostContent from '@/components/sikk/SikkPostContent';
import ShareButton from '@/components/sikk/ShareButton';
import { auth } from '@/lib/auth';

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

interface SikkPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SikkPostPageProps) {
  try {
    const { slug } = await params;
    const post = await getSikkPostBySlugAsync(slug);

    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    return {
      title: `${post.title} | Sikk`,
      description: post.description || '',
    };
  } catch (error) {
    console.error('Error generating metadata for sikk post:', error);
    return {
      title: 'Sikk',
    };
  }
}

export async function generateStaticParams() {
  try {
    const posts = await getAllSikkPostsAsync();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for sikk posts:', error);
    return [];
  }
}

export default async function SikkPostPage({ params }: SikkPostPageProps) {
  // Check admin access - Sikk is admin-only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const { slug } = await params;
  const post = await getSikkPostBySlugAsync(slug);

  if (!post) {
    notFound();
  }

  const isPrivate = !post.isPublic;

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readingTime = calculateReadingTime(post.content);
  const [relatedPosts, { prevPost, nextPost }, categories, sections] = await Promise.all([
    getRelatedSikkPostsAsync(slug, 3),
    getAdjacentSikkPostsAsync(slug),
    getSikkRootCategoriesAsync(),
    getSikkSectionsAsync(),
  ]);
  const difficulty = estimateDifficulty(post.content, post.tags);

  return (
    <>
      <ReadingProgressBar readingTime={readingTime} />
      <SikkPostLayout
        content={post.content}
        tags={post.tags}
        category={post.category}
        relatedPosts={relatedPosts}
        categories={categories}
        currentCategorySlugPath={post.categorySlugPath}
        sections={sections}
      >
        {/* Banner Image */}
        {post.thumbnail && (
          <div className="mb-8 -mx-4 sm:-mx-6 lg:-mx-8 rounded-xl overflow-hidden">
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
          <div className="flex items-center text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            <Link href="/sikk" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Sikk
            </Link>
            {post.category && (
              <>
                <span className="mx-2">/</span>
                <span>{post.category}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <DifficultyBadge level={difficulty} />
            {isPrivate ? (
              <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full border border-yellow-300 dark:border-yellow-700">
                비공개
              </span>
            ) : (
              <ShareButton slug={post.slug} title={post.title} />
            )}
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
            <div className="flex flex-wrap gap-2 lg:hidden">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Pink Divider */}
        <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

        {/* Content */}
        <SikkPostContent content={post.content} slug={post.slug} isAdmin={true} />

        {/* Post Navigation */}
        <PostNavigation prevPost={prevPost} nextPost={nextPost} basePath="/sikk" variant="pink" />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t-2 border-pink-300 dark:border-pink-500">
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
      </SikkPostLayout>
      <FloatingActions />
    </>
  );
}
