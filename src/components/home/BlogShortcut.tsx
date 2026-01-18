'use client';

import Link from 'next/link';

interface BlogShortcutProps {
  postCount: number;
  categoryCount: number;
  tagCount: number;
}

export default function BlogShortcut({ postCount, categoryCount, tagCount }: BlogShortcutProps) {
  const stats = [
    { value: postCount, label: '포스트', color: 'pink' },
    { value: categoryCount, label: '카테고리', color: 'cyan' },
    { value: tagCount, label: '태그', color: 'purple' },
  ];

  return (
    <Link href="/blog" className="block group">
      <div
        className="relative rounded-2xl py-12 px-8 md:py-14 md:px-10 overflow-hidden transition-all duration-300
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
          border border-gray-200 dark:border-indigo-400/30
          shadow-lg shadow-gray-200/50 dark:shadow-indigo-500/10
          hover:border-indigo-300 dark:hover:border-indigo-300/50
          hover:shadow-2xl hover:shadow-indigo-200/40 dark:hover:shadow-indigo-400/30
          hover:-translate-y-3"
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, var(--neon-cyan-glow) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, var(--neon-pink-glow) 0%, transparent 50%)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-indigo-300 dark:border-indigo-400 rounded-tl-xl opacity-60 dark:opacity-80" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-violet-300 dark:border-violet-400 rounded-tr-xl opacity-60 dark:opacity-80" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-violet-300 dark:border-violet-400 rounded-bl-xl opacity-60 dark:opacity-80" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-indigo-300 dark:border-indigo-400 rounded-br-xl opacity-60 dark:opacity-80" />

        {/* Grid lines - subtle in light, more visible in dark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.08]"
          style={{
            backgroundImage: 'linear-gradient(var(--neon-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--neon-cyan) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Content */}
          <div className="text-left">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-start gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center
                  bg-indigo-100 dark:bg-indigo-500/25
                  border border-indigo-200 dark:border-indigo-400/40"
                style={{ boxShadow: '0 0 15px var(--neon-cyan-glow)' }}
              >
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <span className="text-gray-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-indigo-300 dark:via-white dark:to-violet-300">
                Blog
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-base mb-6 max-w-md">
              개발, 기술, 그리고 더 많은 것들에 대한 기록.
              <br />
              배움의 여정을 함께 나누는 공간입니다.
            </p>
            <span className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-200 transition-colors font-medium">
              모든 글 보기
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>

          {/* Stats */}
          <div className="flex gap-4 md:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`text-center px-4 py-3 rounded-xl transition-all hover:scale-105
                  ${stat.color === 'pink' ? 'bg-violet-50 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-400/40' : ''}
                  ${stat.color === 'cyan' ? 'bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/40' : ''}
                  ${stat.color === 'purple' ? 'bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-400/40' : ''}
                `}
              >
                <p
                  className={`text-3xl md:text-4xl font-bold
                    ${stat.color === 'pink' ? 'text-violet-600 dark:text-violet-300' : ''}
                    ${stat.color === 'cyan' ? 'text-indigo-600 dark:text-indigo-300' : ''}
                    ${stat.color === 'purple' ? 'text-purple-600 dark:text-purple-300' : ''}
                  `}
                >
                  {stat.value}
                </p>
                <p className="text-gray-500 dark:text-gray-300 text-sm mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
