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
          bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
          border border-gray-200 dark:border-pink-500/20
          shadow-lg shadow-gray-200/50 dark:shadow-pink-500/5
          hover:border-pink-300 dark:hover:border-pink-400/40
          hover:shadow-xl hover:shadow-pink-200/30 dark:hover:shadow-pink-500/10"
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, var(--neon-pink-glow) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, var(--neon-cyan-glow) 0%, transparent 50%)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-pink-300 dark:border-pink-400/60 rounded-tl-xl opacity-60" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-300 dark:border-cyan-400/60 rounded-tr-xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-300 dark:border-cyan-400/60 rounded-bl-xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-pink-300 dark:border-pink-400/60 rounded-br-xl opacity-60" />

        {/* Scan line effect - dark mode only */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Profile Avatar */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 dark:from-pink-500 dark:via-rose-500 dark:to-pink-600 flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0 text-white relative"
            style={{
              boxShadow: '0 0 30px var(--neon-pink-glow), inset 0 0 20px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Rotating ring - dark mode only */}
            <div
              className="absolute inset-[-4px] rounded-full border-2 border-transparent animate-spin hidden dark:block"
              style={{
                animationDuration: '8s',
                background: 'linear-gradient(0deg, transparent 40%, var(--neon-cyan) 50%, transparent 60%) border-box',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
            NK
          </div>

          {/* Content */}
          <div className="text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-white">
              Namryeong Kim
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-base mb-2 max-w-xl">
              M.S. Candidate in Convergence Security Engineering.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base mb-4 max-w-xl">
              Web3 Security, AI Security, 그리고 자동화된 취약점 탐지를 연구합니다.
            </p>
            <div className="flex flex-wrap justify-start gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105
                    ${tag.color === 'pink' ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/30' : ''}
                    ${tag.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30' : ''}
                    ${tag.color === 'purple' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' : ''}
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
              bg-pink-100 dark:bg-pink-500/20
              border border-pink-200 dark:border-pink-500/30
              group-hover:bg-pink-200 dark:group-hover:bg-pink-500/30
              group-hover:border-pink-300 dark:group-hover:border-pink-400/50"
            style={{
              boxShadow: '0 0 15px var(--neon-pink-glow)',
            }}
          >
            <svg
              className="w-6 h-6 text-pink-500 dark:text-pink-400 group-hover:translate-x-1 transition-transform"
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
