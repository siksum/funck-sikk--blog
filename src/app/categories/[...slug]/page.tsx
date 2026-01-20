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

  const [childCategories, directPosts, allPosts, recentPosts, categories, tags, sections] = await Promise.all([
    getChildCategoriesWithTagsAsync(slugPath),
    getPostsByCategoryPathAsync(slugPath, false),
    getPostsByCategoryPathAsync(slugPath, true),
    getRecentPostsAsync(5),
    getRootCategoriesAsync(),
    getAllTagsAsync(),
    getSections(),
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
    />
  );
}
