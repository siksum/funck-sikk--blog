import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlugAsync, getAllPostsAsync, getRelatedPostsAsync, getAdjacentPostsAsync, getRootCategoriesAsync } from '@/lib/posts';
import CommentSection from '@/components/comments/CommentSection';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import PostNavigation from '@/components/blog/PostNavigation';
import FloatingActions from '@/components/blog/FloatingActions';
import SocialShareButtons from '@/components/blog/SocialShareButtons';
import EmojiReactions from '@/components/blog/EmojiReactions';
import AuthorCard from '@/components/blog/AuthorCard';
import KeyboardNavigation from '@/components/blog/KeyboardNavigation';
import HighlightShare from '@/components/blog/HighlightShare';
import DifficultyBadge from '@/components/blog/DifficultyBadge';
import BlogPostLayout from '@/components/blog/BlogPostLayout';
import BlogPostContent from '@/components/blog/BlogPostContent';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Revalidate every 10 seconds for faster updates
export const revalidate = 10;

async function getSections() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        categories: {
          include: {
            parent: {
              include: {
                parent: true, // Support up to 3 levels of nesting
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build full slugPath for each category based on its parent chain
    return sections.map((section) => ({
      ...section,
      categories: section.categories.map((cat) => {
        const slugPath: string[] = [];
        const path: string[] = [];

        // Build path from parent chain (root to current)
        if (cat.parent?.parent) {
          slugPath.push(cat.parent.parent.slug);
          path.push(cat.parent.parent.name);
        }
        if (cat.parent) {
          slugPath.push(cat.parent.slug);
          path.push(cat.parent.name);
        }
        slugPath.push(cat.slug);
        path.push(cat.name);

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          slugPath,
          path,
        };
      }),
    }));
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return [];
  }
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Estimate difficulty based on content length and tags
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

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | func(sikk)`,
    description: post.description,
  };
}

export async function generateStaticParams() {
  const posts = await getAllPostsAsync();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlugAsync(slug);

  if (!post) {
    notFound();
  }

  // Check admin status
  const session = await auth();
  const isAdmin = session?.user?.isAdmin || false;

  // Check if post is private
  const isPrivate = !post.isPublic;

  // If post is private and user is not admin, show 404
  if (isPrivate && !isAdmin) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readingTime = calculateReadingTime(post.content);
  const [relatedPosts, { prevPost, nextPost }, categories, sections] = await Promise.all([
    getRelatedPostsAsync(slug, 3),
    getAdjacentPostsAsync(slug),
    getRootCategoriesAsync(),
    getSections(),
  ]);
  const difficulty = estimateDifficulty(post.content, post.tags);

  return (
    <>
      <ReadingProgressBar readingTime={readingTime} />
      <HighlightShare />
      <BlogPostLayout
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
            <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/categories/${encodeURIComponent(post.category)}`}
              className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {post.category}
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <DifficultyBadge level={difficulty} />
            {isPrivate && (
              <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full border border-yellow-300 dark:border-yellow-700">
                비공개 미리보기
              </span>
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
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-2 py-1 rounded transition-colors hover:scale-105"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Violet Divider */}
        <hr className="mb-8 border-t-2 border-violet-400 dark:border-violet-500" />

        {/* Content */}
        <BlogPostContent
          content={post.content}
          slug={slug}
          isAdmin={isAdmin}
          initialMetadata={{
            title: post.title,
            description: post.description || '',
            date: post.date,
            tags: post.tags,
            category: post.category || '',
            isPublic: post.isPublic,
            thumbnail: post.thumbnail,
            thumbnailPosition: post.thumbnailPosition,
            thumbnailScale: post.thumbnailScale,
          }}
        />

        {/* Violet Divider before comments */}
        <hr className="my-8 border-t-2 border-violet-400 dark:border-violet-500" />

        {/* Comments with Reactions */}
        <CommentSection
          postSlug={slug}
          reactionsContent={
            <div className="text-center">
              <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                이 글이 마음에 드셨다면 반응이나 댓글을 남겨주세요!
              </p>
              <EmojiReactions postSlug={slug} />
            </div>
          }
        />

        {/* Share Buttons */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>공유</span>
          <div className="h-px w-8" style={{ backgroundColor: 'var(--card-border)' }} />
          <SocialShareButtons title={post.title} />
        </div>

        {/* Post Navigation */}
        <PostNavigation prevPost={prevPost} nextPost={nextPost} />

        {/* Author Card */}
        <AuthorCard />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <Link
            href="/blog"
            className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:underline"
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
            블로그 목록으로 돌아가기
          </Link>
        </footer>
      </BlogPostLayout>
      <FloatingActions />
      <KeyboardNavigation prevPost={prevPost} nextPost={nextPost} />
    </>
  );
}
