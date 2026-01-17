import PostEditor from '@/components/admin/PostEditor';
import Link from 'next/link';

export default function NewPostPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← 목록으로
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          새 포스트 작성
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <PostEditor />
      </div>
    </div>
  );
}
