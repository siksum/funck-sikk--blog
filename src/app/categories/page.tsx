import Link from 'next/link';
import { getAllCategories, getPostsByCategory } from '@/lib/posts';

export const metadata = {
  title: '카테고리 | Funck Sikk Blog',
  description: '블로그 카테고리 목록',
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        카테고리
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/categories/${encodeURIComponent(category.name)}`}
            className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {category.name}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
                {category.count}개
              </span>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 py-12">
          아직 카테고리가 없습니다.
        </p>
      )}
    </div>
  );
}
