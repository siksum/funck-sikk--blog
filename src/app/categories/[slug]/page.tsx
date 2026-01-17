import { notFound } from 'next/navigation';
import PostList from '@/components/post/PostList';
import { getPostsByCategory, getAllCategories } from '@/lib/posts';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);

  return {
    title: `${categoryName} | Funck Sikk Blog`,
    description: `${categoryName} 카테고리의 포스트 목록`,
  };
}

export async function generateStaticParams() {
  const categories = getAllCategories();

  return categories.map((category) => ({
    slug: encodeURIComponent(category.name),
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);
  const posts = getPostsByCategory(categoryName);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <a
          href="/categories"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← 카테고리 목록
        </a>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {categoryName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {posts.length}개의 포스트
        </p>
      </div>

      <PostList posts={posts} />
    </div>
  );
}
