'use client';

import { useEffect, useState } from 'react';

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

interface HeroClientProps {
  stats: StatItem[];
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }

    const duration = 1500;
    const steps = 30;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
      {count}
      <span className="text-lg ml-1 text-gray-600 dark:text-gray-300">{suffix}</span>
    </span>
  );
}

export default function HeroClient({ stats }: HeroClientProps) {
  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 md:py-32 overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-rose-200/40 to-pink-300/40 dark:from-rose-900/20 dark:to-pink-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-pink-200/40 to-rose-300/40 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-100/30 to-pink-100/30 dark:from-rose-900/10 dark:to-pink-900/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(244,114,182,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(244,114,182,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-rose-200/50 dark:border-rose-800/30 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Web3 Security Researcher</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              func
            </span>
            <span className="text-gray-800 dark:text-white">(</span>
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 bg-clip-text text-transparent">
              sikk
            </span>
            <span className="text-gray-800 dark:text-white">)</span>
          </h1>

          {/* Subtitle with typing effect style */}
          <p className="text-xl md:text-2xl font-medium text-gray-700 dark:text-gray-200 mb-6 tracking-wide">
            <span className="text-rose-500">&gt;</span> I LOVE WHAT I DO<span className="animate-pulse">_</span>
          </p>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-12 text-lg leading-relaxed">
            보안 연구, 취약점 분석, 그리고 더 많은 것들에 대한 기록.
            <br />
            <span className="text-rose-500 font-medium">나눔으로 커지는 지식</span>을 믿습니다.
          </p>

          {/* Stats with enhanced design */}
          <div className="inline-flex items-center gap-6 md:gap-12 px-8 py-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-xl shadow-rose-200/20 dark:shadow-rose-900/10">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center flex items-center gap-6 md:gap-12">
                <div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
                {index < stats.length - 1 && (
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-rose-300/50 to-transparent dark:via-rose-700/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
