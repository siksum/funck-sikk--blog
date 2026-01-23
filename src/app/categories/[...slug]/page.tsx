import { notFound } from 'next/navigation';
import CategoryPageContent from '@/components/category/CategoryPageContent';
import {
  getCategoryBySlugPathAsync,
  getPostsByCategoryPathAsync,
  getChildCategoriesWithTagsAsync,
  getAllCategoriesHierarchicalAsync,
  getRecentPostsAsync,
  getAllTagsAsync,
  getRootCategoriesAsync,
} from '@/lib/posts';
import { prisma } from '@/lib/db';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

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

async function getDatabasesByCategory(categoryPath: string) {
  try {
    const databases = await prisma.blogDatabase.findMany({
      where: {
        category: categoryPath,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return databases;
  } catch (error) {
    console.error('Failed to fetch databases:', error);
    return [];
  }
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = await getCategoryBySlugPathAsync(slugPath);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const fullPath = category.path.join(' > ');
  return {
    title: `${fullPath} | func(sikk)`,
    description: `${fullPath} 카테고리의 포스트 목록`,
  };
}

export async function generateStaticParams() {
  const categories = await getAllCategoriesHierarchicalAsync();

  return categories.map((category) => ({
    slug: category.slugPath,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = await getCategoryBySlugPathAsync(slugPath);

  if (!category) {
    notFound();
  }

  const categoryPathString = category.path.join('/');

  const [childCategories, directPosts, allPosts, recentPosts, categories, tags, sections, databases] = await Promise.all([
    getChildCategoriesWithTagsAsync(slugPath),
    getPostsByCategoryPathAsync(slugPath, false),
    getPostsByCategoryPathAsync(slugPath, true),
    getRecentPostsAsync(5),
    getRootCategoriesAsync(),
    getAllTagsAsync(),
    getSections(),
    getDatabasesByCategory(categoryPathString),
  ]);

  return (
    <CategoryPageContent
      category={{
        name: category.name,
        path: category.path,
        slugPath: category.slugPath,
      }}
      childCategories={childCategories}
      directPosts={directPosts}
      allPostsCount={allPosts.length}
      recentPosts={recentPosts}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
