import HeroSection from '@/components/home/HeroSection';
import AboutPreview from '@/components/home/AboutPreview';
import BlogShortcut from '@/components/home/BlogShortcut';
import SubscribeForm from '@/components/subscribe/SubscribeForm';
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/posts';

export default function Home() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* About Preview Bar */}
        <AboutPreview />

        {/* Blog Shortcut Bar */}
        <BlogShortcut
          postCount={posts.length}
          categoryCount={categories.length}
          tagCount={tags.length}
        />

        {/* Subscribe Section */}
        <div className="mt-4">
          <SubscribeForm />
        </div>
      </div>
    </>
  );
}
