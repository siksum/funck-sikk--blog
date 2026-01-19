import { Post } from '@/types';
import PostCard from './PostCard';

interface PostListProps {
  posts: Post[];
  variant?: 'grid' | 'list';
}

export default function PostList({ posts, variant = 'grid' }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-violet-400 dark:text-violet-500"
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
        <p style={{ color: 'var(--foreground-muted)' }}>
          아직 작성된 포스트가 없습니다.
        </p>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} variant="compact" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
