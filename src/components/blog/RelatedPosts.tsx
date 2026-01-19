import Link from 'next/link';
import { Post } from '@/types';

interface RelatedPostsProps {
  posts: Post[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <h2
        className="text-xl font-bold mb-6 flex items-center gap-2"
        style={{ color: 'var(--foreground)' }}
      >
        <svg
          className="w-5 h-5 text-violet-600 dark:text-violet-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        관련 포스트
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => {
          const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block p-4 rounded-xl border transition-all duration-300
                hover:border-violet-400 dark:hover:border-violet-400/60
                hover:shadow-lg hover:shadow-violet-200/20 dark:hover:shadow-violet-500/10"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <h3
                className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                {post.title}
              </h3>
              <p
                className="text-xs line-clamp-2 mb-3"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {post.description}
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                <time dateTime={post.date}>{formattedDate}</time>
                <span>·</span>
                <span className="text-violet-600 dark:text-violet-400">{post.category}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
