import PostList from '@/components/post/PostList';
import { getAllPosts } from '@/lib/posts';

export const metadata = {
  title: '블로그 | Funck Sikk Blog',
  description: '모든 블로그 포스트',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        블로그
      </h1>
      <PostList posts={posts} />
    </div>
  );
}
