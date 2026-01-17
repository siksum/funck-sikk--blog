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
        className="block group p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <h3 className="text-sm font-medium group-hover:text-blue-600 transition-colors line-clamp-2" style={{ color: 'var(--foreground)' }}>
          {post.title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          {formattedDate}
        </p>
      </Link>
    );
  }

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/blog/${post.slug}`} className="block p-5">
        {/* Category */}
        <span
          className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-3"
          style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
        >
          {post.category}
        </span>

        {/* Title */}
        <h2 className="text-lg font-semibold group-hover:text-blue-600 transition-colors mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>
          {post.title}
        </h2>

        {/* Description */}
        <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
          <time dateTime={post.date}>{formattedDate}</time>
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
