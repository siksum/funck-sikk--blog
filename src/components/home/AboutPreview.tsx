'use client';

import Link from 'next/link';

export default function AboutPreview() {
  const tags = [
    { name: 'Web3 Security', color: 'pink' },
    { name: 'AI Security', color: 'cyan' },
    { name: 'Smart Contract', color: 'purple' },
  ];

  return (
    <Link href="/about" className="block group">
      <div
        className="relative rounded-2xl py-12 px-8 md:py-14 md:px-10 overflow-hidden transition-all duration-300
          backdrop-blur-xl
          border border-gray-200 dark:border-violet-500/60
          shadow-lg shadow-gray-200/50 dark:shadow-[0_0_25px_rgba(167,139,250,0.4),_inset_0_0_30px_rgba(167,139,250,0.05)]
          hover:border-2 hover:border-violet-500/70 dark:hover:border-violet-400/80
          hover:shadow-2xl hover:shadow-violet-200/40 dark:hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]
          hover:-translate-y-3"
        style={{ background: 'var(--card-bg)' }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, var(--neon-pink-glow) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, var(--neon-cyan-glow) 0%, transparent 50%)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-violet-300 dark:border-violet-400 rounded-tl-xl opacity-60 dark:opacity-80" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-indigo-300 dark:border-indigo-400 rounded-tr-xl opacity-60 dark:opacity-80" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-indigo-300 dark:border-indigo-400 rounded-bl-xl opacity-60 dark:opacity-80" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-violet-300 dark:border-violet-400 rounded-br-xl opacity-60 dark:opacity-80" />

        {/* Scan line effect - dark mode only */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Content */}
          <div className="text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              Namryeong Kim
            </h3>
            <p className="text-base mb-2 max-w-xl" style={{ color: 'var(--foreground-muted)' }}>
              M.S. Candidate in Convergence Security Engineering.
            </p>
            <p className="text-base mb-4 max-w-xl" style={{ color: 'var(--foreground-muted)' }}>
              Web3 Security, AI Security, 그리고 자동화된 취약점 탐지를 연구합니다.
            </p>
            <div className="flex flex-wrap justify-start gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105
                    ${tag.color === 'pink' ? 'bg-violet-100 dark:bg-violet-500/25 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-400/40' : ''}
                    ${tag.color === 'cyan' ? 'bg-indigo-100 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/40' : ''}
                    ${tag.color === 'purple' ? 'bg-purple-100 dark:bg-purple-500/25 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-400/40' : ''}
                  `}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all
              bg-violet-100 dark:bg-violet-500/25
              border border-violet-200 dark:border-violet-400/40
              group-hover:bg-violet-200 dark:group-hover:bg-violet-500/35
              group-hover:border-violet-300 dark:group-hover:border-violet-300/60"
            style={{
              boxShadow: '0 0 15px var(--neon-pink-glow)',
            }}
          >
            <svg
              className="w-6 h-6 text-violet-500 dark:text-violet-300 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
