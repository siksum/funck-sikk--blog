import HeroSection from '@/components/home/HeroSection';
import PostList from '@/components/post/PostList';
import SubscribeForm from '@/components/subscribe/SubscribeForm';
import { getRecentPosts } from '@/lib/posts';

export default function Home() {
  const recentPosts = getRecentPosts(6);

  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            최신 포스트
          </h2>
          <a
            href="/blog"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            전체 보기 →
          </a>
        </div>
        <PostList posts={recentPosts} />

        {/* Subscribe Section */}
        <div className="mt-12">
          <SubscribeForm />
        </div>
      </div>
    </>
  );
}
