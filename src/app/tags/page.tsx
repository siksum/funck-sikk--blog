import Link from 'next/link';
import { getAllTagsAsync } from '@/lib/posts';

export const metadata = {
  title: '태그 | func(sikk)',
  description: '블로그 태그 목록',
};

// Revalidate every 10 seconds for faster updates
export const revalidate = 10;

export default async function TagsPage() {
  const tags = await getAllTagsAsync();

  // Calculate tag sizes based on count
  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const getTagSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'text-2xl';
    if (ratio > 0.5) return 'text-xl';
    if (ratio > 0.25) return 'text-lg';
    return 'text-base';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        태그
      </h1>

      <div className="rounded-xl shadow-sm border p-8" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex flex-wrap gap-4 justify-center">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name)}`}
              className={`${getTagSize(tag.count)} px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors`}
            >
              #{tag.name}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({tag.count})
              </span>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-12">
            아직 태그가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
