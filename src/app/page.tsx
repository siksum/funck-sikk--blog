import HeroSection from '@/components/home/HeroSection';
import AboutPreview from '@/components/home/AboutPreview';
import BlogShortcut from '@/components/home/BlogShortcut';
import GithubGrass from '@/components/home/GithubGrass';
import NewsletterCTA from '@/components/blog/NewsletterCTA';
import { getAllPostsAsync, getAllCategoriesAsync, getAllTagsAsync } from '@/lib/posts';
import { prisma } from '@/lib/db';

interface DatabaseItemData {
  date?: string;
  [key: string]: unknown;
}

export default async function Home() {
  const [posts, categories, tags, blogDatabaseItems] = await Promise.all([
    getAllPostsAsync(),
    getAllCategoriesAsync(),
    getAllTagsAsync(),
    prisma.blogDatabaseItem.findMany({
      where: {
        database: { isPublic: true },
      },
      select: { data: true, createdAt: true },
    }),
  ]);

  // Extract post dates for GithubGrass
  const blogPostDates = posts.map((post) => post.date);

  // Extract dates from blog database items (use date column if exists, otherwise createdAt)
  const databaseItemDates = blogDatabaseItems.map((item) => {
    const data = item.data as DatabaseItemData;
    if (data.date && typeof data.date === 'string') {
      return data.date.split('T')[0];
    }
    return item.createdAt.toISOString().split('T')[0];
  });

  // Combine all dates
  const postDates = [...blogPostDates, ...databaseItemDates];

  return (
    <>
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* About Preview Bar */}
        <AboutPreview />

        {/* Blog Shortcut Bar */}
        <BlogShortcut
          postCount={posts.length + blogDatabaseItems.length}
          categoryCount={categories.length}
          tagCount={tags.length}
        />

        {/* GitHub Grass */}
        <GithubGrass postDates={postDates} />

        {/* Newsletter Subscription */}
        <NewsletterCTA />
      </div>
    </>
  );
}
