import PostList from '@/components/post/PostList';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllPosts, getRecentPosts, getAllCategories, getAllTags } from '@/lib/posts';

export const metadata = {
  title: '블로그 | Funck Sikk Blog',
  description: '모든 블로그 포스트',
};

export default function BlogPage() {
  const posts = getAllPosts();
  const recentPosts = getRecentPosts(5);
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        블로그
      </h1>

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
  );
}
