import PostList from '@/components/post/PostList';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllPosts, getRecentPosts, getAllCategories, getAllTags } from '@/lib/posts';

export const metadata = {
  title: '블로그 | func(sikk)',
  description: '모든 블로그 포스트',
};

export default function BlogPage() {
  const posts = getAllPosts();
  const recentPosts = getRecentPosts(5);
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <div
      className="min-h-screen py-12"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Page Header */}
        <div className="mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-300 dark:to-indigo-400">
              Blog
            </span>
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            개발, 기술, 그리고 더 많은 것들에 대한 기록
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <PostList posts={posts} />
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            <Sidebar
              recentPosts={recentPosts}
              popularPosts={recentPosts}
              categories={categories}
              tags={tags}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
