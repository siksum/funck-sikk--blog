import BlogPageContent from '@/components/blog/BlogPageContent';
import { getRecentPosts, getAllTags, getRootCategoriesWithTags, getRootCategories } from '@/lib/posts';
import { prisma } from '@/lib/db';

export const metadata = {
  title: '블로그 | func(sikk)',
  description: '모든 블로그 포스트',
};

// Revalidate sections every 60 seconds
export const revalidate = 60;

async function getSections() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        categories: {
          where: { parentId: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    return sections;
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return [];
  }
}

export default async function BlogPage() {
  const recentPosts = getRecentPosts(5);
  const categories = getRootCategories();
  const tags = getAllTags();
  const rootCategoriesWithTags = getRootCategoriesWithTags();
  const sections = await getSections();

  return (
    <BlogPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
    />
  );
}
