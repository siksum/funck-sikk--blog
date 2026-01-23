import Link from 'next/link';
import { Post } from '@/types';

interface PostNavigationProps {
  prevPost: Post | null;
  nextPost: Post | null;
  basePath?: string;
  variant?: 'default' | 'pink';
}

function getPostUrl(post: Post, basePath: string): string {
  // If the post has categorySlugPath, use it to build the full URL
  if (post.categorySlugPath && post.categorySlugPath.length > 0) {
    const categoryPath = post.categorySlugPath.map(s => encodeURIComponent(s)).join('/');
    return `${basePath}/${categoryPath}/${encodeURIComponent(post.slug)}`;
  }
  // Fallback for uncategorized posts
  return `${basePath}/uncategorized/${encodeURIComponent(post.slug)}`;
}

export default function PostNavigation({ prevPost, nextPost, basePath = '/blog/categories', variant = 'default' }: PostNavigationProps) {
  const isPink = variant === 'pink';

  const hoverClasses = isPink
    ? 'hover:border-pink-400 dark:hover:border-pink-400/60 hover:shadow-lg hover:shadow-pink-200/20 dark:hover:shadow-pink-500/10'
    : 'hover:border-violet-400 dark:hover:border-violet-400/60 hover:shadow-lg hover:shadow-violet-200/20 dark:hover:shadow-violet-500/10';

  const textHoverClasses = isPink
    ? 'group-hover:text-pink-600 dark:group-hover:text-pink-400'
    : 'group-hover:text-violet-600 dark:group-hover:text-violet-400';

  const borderClasses = isPink
    ? 'border-2 border-pink-200 dark:border-pink-500/40'
    : '';

  return (
    <nav className="mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previous Post */}
        <div>
          {prevPost ? (
            <Link
              href={getPostUrl(prevPost, basePath)}
              className={`group block p-4 rounded-xl h-full transition-all duration-300 ${hoverClasses} ${borderClasses}`}
              style={{ background: 'var(--card-bg)', borderColor: isPink ? undefined : 'var(--card-border)' }}
            >
              <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                이전 포스트
              </div>
              <h4
                className={`font-semibold line-clamp-2 ${textHoverClasses} transition-colors`}
                style={{ color: 'var(--foreground)' }}
              >
                {prevPost.title}
              </h4>
            </Link>
          ) : (
            <div
              className={`p-4 rounded-xl h-full opacity-50 ${borderClasses}`}
              style={{ background: 'var(--card-bg)', borderColor: isPink ? undefined : 'var(--card-border)' }}
            >
              <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                이전 포스트
              </div>
              <span style={{ color: 'var(--foreground-muted)' }}>첫 번째 포스트입니다</span>
            </div>
          )}
        </div>

        {/* Next Post */}
        <div>
          {nextPost ? (
            <Link
              href={getPostUrl(nextPost, basePath)}
              className={`group block p-4 rounded-xl h-full transition-all duration-300 text-right ${hoverClasses} ${borderClasses}`}
              style={{ background: 'var(--card-bg)', borderColor: isPink ? undefined : 'var(--card-border)' }}
            >
              <div className="flex items-center justify-end gap-2 text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                다음 포스트
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h4
                className={`font-semibold line-clamp-2 ${textHoverClasses} transition-colors`}
                style={{ color: 'var(--foreground)' }}
              >
                {nextPost.title}
              </h4>
            </Link>
          ) : (
            <div
              className={`p-4 rounded-xl h-full text-right opacity-50 ${borderClasses}`}
              style={{ background: 'var(--card-bg)', borderColor: isPink ? undefined : 'var(--card-border)' }}
            >
              <div className="flex items-center justify-end gap-2 text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
                다음 포스트
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <span style={{ color: 'var(--foreground-muted)' }}>마지막 포스트입니다</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
