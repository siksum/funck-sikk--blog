import Link from 'next/link';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'compact';
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="block group p-4 transition-colors hover:bg-violet-50 dark:hover:bg-violet-500/10"
      >
        <h3
          className="text-sm font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2"
          style={{ color: 'var(--foreground)' }}
        >
          {post.title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
          {formattedDate}
        </p>
      </Link>
    );
  }

  return (
    <article
      className="group rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-xl
        border border-gray-200 dark:border-violet-500/30
        hover:border-violet-300 dark:hover:border-violet-400/60
        hover:shadow-xl hover:shadow-violet-200/30 dark:hover:shadow-[0_0_30px_rgba(167,139,250,0.3)]
        hover:-translate-y-1"
      style={{ background: 'var(--card-bg)' }}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Thumbnail */}
        {post.thumbnail ? (
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="relative w-full aspect-video overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--violet-100) 0%, var(--indigo-100) 100%)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Category Breadcrumb */}
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {post.categoryPath.map((name, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-3 h-3 mx-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-full border border-violet-200 dark:border-violet-500/40"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  {name}
                </span>
              </span>
            ))}
          </div>

          {/* Title */}
          <h2
            className="text-lg font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-2 line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {post.title}
          </h2>

          {/* Description */}
          <p
            className="text-sm line-clamp-2 mb-4"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {post.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            <time dateTime={post.date}>{formattedDate}</time>
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/40"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
