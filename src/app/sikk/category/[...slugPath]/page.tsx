import { notFound, redirect } from 'next/navigation';
import SikkCategoryPageContent from '@/components/sikk/SikkCategoryPageContent';
import {
  getSikkCategoryBySlugPathAsync,
  getSikkPostsByCategoryPathAsync,
  getSikkChildCategoriesWithTagsAsync,
  getAllSikkCategoriesHierarchicalAsync,
  getRecentSikkPostsAsync,
  getAllSikkTagsAsync,
  getSikkRootCategoriesAsync,
} from '@/lib/sikk';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

interface CategoryPageProps {
  params: Promise<{ slugPath: string[] }>;
}

export const revalidate = 10;

async function getSikkSections() {
  try {
    const sections = await prisma.sikkSection.findMany({
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
    console.error('Failed to fetch sikk sections:', error);
    return [];
  }
}

async function getDatabasesByCategory(categoryPath: string) {
  try {
    const databases = await prisma.sikkDatabase.findMany({
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
  const { slugPath } = await params;
  const category = await getSikkCategoryBySlugPathAsync(slugPath);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const fullPath = category.path.join(' > ');
  return {
    title: `${fullPath} | Sikk`,
    description: `${fullPath} 카테고리의 포스트 목록`,
  };
}

export async function generateStaticParams() {
  const categories = await getAllSikkCategoriesHierarchicalAsync();

  return categories.map((category) => ({
    slugPath: category.slugPath,
  }));
}

export default async function SikkCategoryPage({ params }: CategoryPageProps) {
  // Check admin access - Sikk is admin-only
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect('/');
  }

  const { slugPath } = await params;
  const category = await getSikkCategoryBySlugPathAsync(slugPath);

  if (!category) {
    notFound();
  }

  // Build the category path string (e.g., "성신여자대학교/1번")
  const categoryPathString = category.path.join('/');

  const [childCategories, directPosts, allPosts, categories, tags, sections, databases] = await Promise.all([
    getSikkChildCategoriesWithTagsAsync(slugPath),
    getSikkPostsByCategoryPathAsync(slugPath, false),
    getSikkPostsByCategoryPathAsync(slugPath, true),
    getSikkRootCategoriesAsync(),
    getAllSikkTagsAsync(),
    getSikkSections(),
    getDatabasesByCategory(categoryPathString),
  ]);

  return (
    <SikkCategoryPageContent
      category={{
        name: category.name,
        path: category.path,
        slugPath: category.slugPath,
      }}
      childCategories={childCategories}
      directPosts={directPosts}
      allPostsCount={allPosts.length}
      categories={categories}
      tags={tags}
      sections={sections}
      databases={databases}
    />
  );
}
