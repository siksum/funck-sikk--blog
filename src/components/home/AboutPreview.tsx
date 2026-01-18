import Link from 'next/link';

export default function AboutPreview() {
  return (
    <Link href="/about" className="block group">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden transition-transform hover:scale-[1.02]">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Profile Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl md:text-4xl font-bold shrink-0">
            FS
          </div>

          {/* Content */}
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              About Me
            </h3>
            <p className="text-white/90 text-lg mb-4 max-w-xl">
              개발과 기술에 관심이 많은 블로거입니다. 웹 개발, 프로그래밍, 그리고 다양한 기술 관련 주제들을 다룹니다.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">React</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Next.js</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">TypeScript</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Node.js</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
