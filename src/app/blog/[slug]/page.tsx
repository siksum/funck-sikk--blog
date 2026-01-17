import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import MDXContent from '@/components/mdx/MDXContent';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

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
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/blog" className="hover:text-blue-500">
            Blog
          </Link>
          <span>/</span>
          <Link
            href={`/categories/${encodeURIComponent(post.category)}`}
            className="hover:text-blue-500"
          >
            {post.category}
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          {post.title}
        </h1>

        <p className="text-lg mb-6" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <time dateTime={post.date}>{formattedDate}</time>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-700 mb-8" />

      {/* Content */}
      <MDXContent content={post.content} />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
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
    </article>
  );
}
