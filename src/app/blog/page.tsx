import BlogPageContent from '@/components/blog/BlogPageContent';
import { getRecentPostsAsync, getAllTagsAsync, getRootCategoriesWithTagsAsync, getRootCategoriesAsync } from '@/lib/posts';
import { prisma } from '@/lib/db';

export const metadata = {
  title: '블로그 | func(sikk)',
  description: '모든 블로그 포스트',
};

// Revalidate every 10 seconds for faster updates
export const revalidate = 10;

async function getSections() {
  try {
    const sections = await prisma.section.findMany({
      include: {
        categories: {
          include: {
            parent: {
              include: {
                parent: true, // Support up to 3 levels of nesting
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Build full slugPath for each category based on its parent chain
    return sections.map((section) => ({
      ...section,
      categories: section.categories.map((cat) => {
        const slugPath: string[] = [];
        const path: string[] = [];

        // Build path from parent chain (root to current)
        if (cat.parent?.parent) {
          slugPath.push(cat.parent.parent.slug);
          path.push(cat.parent.parent.name);
        }
        if (cat.parent) {
          slugPath.push(cat.parent.slug);
          path.push(cat.parent.name);
        }
        slugPath.push(cat.slug);
        path.push(cat.name);

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          slugPath,
          path,
        };
      }),
    }));
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return [];
  }
}

async function getBlogDatabases() {
  try {
    const databases = await prisma.blogDatabase.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return databases;
  } catch (error) {
    console.error('Failed to fetch blog databases:', error);
    return [];
  }
}

export default async function BlogPage() {
  const [recentPosts, categories, tags, rootCategoriesWithTags, sections, databases] = await Promise.all([
    getRecentPostsAsync(5),
    getRootCategoriesAsync(),
    getAllTagsAsync(),
    getRootCategoriesWithTagsAsync(),
    getSections(),
    getBlogDatabases(),
  ]);

  return (
    <BlogPageContent
      rootCategoriesWithTags={rootCategoriesWithTags}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
