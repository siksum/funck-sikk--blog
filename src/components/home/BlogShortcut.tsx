import Link from 'next/link';

interface BlogShortcutProps {
  postCount: number;
  categoryCount: number;
  tagCount: number;
}

export default function BlogShortcut({ postCount, categoryCount, tagCount }: BlogShortcutProps) {
  return (
    <Link href="/blog" className="block group">
      <div className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl p-8 md:p-12 relative overflow-hidden transition-transform hover:scale-[1.02] border border-pink-200 dark:border-pink-800/50">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200/50 dark:bg-pink-800/20 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Content */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center md:justify-start gap-3 text-gray-800 dark:text-white">
              <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Blog
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 max-w-md">
              개발, 기술, 그리고 더 많은 것들에 대한 기록.
              배움의 여정을 함께 나누는 공간입니다.
            </p>
            <span className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 group-hover:text-pink-700 dark:group-hover:text-pink-300 transition-colors">
              모든 글 보기
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">{postCount}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">포스트</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">{categoryCount}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">카테고리</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">{tagCount}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">태그</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
