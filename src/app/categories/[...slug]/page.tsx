import { notFound } from 'next/navigation';
import CategoryPageContent from '@/components/category/CategoryPageContent';
import {
  getCategoryBySlugPath,
  getPostsByCategoryPath,
  getChildCategoriesWithTags,
  getAllCategoriesHierarchical,
  getRecentPosts,
  getAllTags,
  getRootCategories,
} from '@/lib/posts';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = getCategoryBySlugPath(slugPath);

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
  const categories = getAllCategoriesHierarchical();

  return categories.map((category) => ({
    slug: category.slugPath,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const slugPath = slug || [];
  const category = getCategoryBySlugPath(slugPath);

  if (!category) {
    notFound();
  }

  const childCategories = getChildCategoriesWithTags(slugPath);
  const directPosts = getPostsByCategoryPath(slugPath, false);
  const allPosts = getPostsByCategoryPath(slugPath, true);

  // Sidebar data
  const recentPosts = getRecentPosts(5);
  const categories = getRootCategories();
  const tags = getAllTags();

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
    />
  );
}
