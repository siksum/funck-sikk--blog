import Link from 'next/link';

export default function AboutPreview() {
  return (
    <Link href="/about" className="block group">
      <div className="bg-gradient-to-r from-rose-50/70 to-pink-50/70 dark:from-rose-900/30 dark:to-pink-900/30 backdrop-blur-xl rounded-2xl py-12 px-8 md:py-20 md:px-12 relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl border border-white/50 dark:border-white/10 shadow-lg shadow-rose-200/30 dark:shadow-rose-900/20">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/50 dark:bg-rose-800/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-100/30 dark:bg-pink-800/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Profile Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-rose-300 to-pink-300 dark:from-rose-700 dark:to-pink-700 flex items-center justify-center text-3xl md:text-4xl font-bold shrink-0 text-white">
            NK
          </div>

          {/* Content */}
          <div className="text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-white">
              Namryeong Kim
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2 max-w-xl">
              M.S. Candidate in Convergence Security Engineering.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4 max-w-xl">
              Web3 Security, AI Security, 그리고 자동화된 취약점 탐지를 연구합니다.
            </p>
            <div className="flex flex-wrap justify-start gap-2">
              <span className="px-3 py-1 bg-rose-100 dark:bg-rose-800/30 rounded-full text-sm text-rose-600 dark:text-rose-300">Web3 Security</span>
              <span className="px-3 py-1 bg-rose-100 dark:bg-rose-800/30 rounded-full text-sm text-rose-600 dark:text-rose-300">AI Security</span>
              <span className="px-3 py-1 bg-rose-100 dark:bg-rose-800/30 rounded-full text-sm text-rose-600 dark:text-rose-300">Smart Contract</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-800/30 group-hover:bg-rose-200 dark:group-hover:bg-rose-700/40 transition-colors shrink-0">
            <svg className="w-6 h-6 text-rose-500 dark:text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
