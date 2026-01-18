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
    <span
      className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500"
      style={{
        textShadow: '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
      }}
    >
      {count}
      <span className="text-lg ml-1 text-gray-500 dark:text-gray-400">{suffix}</span>
    </span>
  );
}

export default function HeroClient({ stats }: HeroClientProps) {
  return (
    <section className="relative bg-gradient-to-br from-gray-50 via-rose-50/30 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-24 md:py-36 overflow-hidden">
      {/* Animated neon orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary neon orb - pink */}
        <div
          className="absolute top-20 right-10 w-80 h-80 rounded-full blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0) 70%)',
          }}
        />
        {/* Secondary neon orb - cyan accent */}
        <div
          className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0) 70%)',
            animationDelay: '1s',
          }}
        />
        {/* Center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(244, 114, 182, 0.15) 0%, transparent 60%)',
          }}
        />
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-bounce opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce opacity-50" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-pink-300 rounded-full animate-bounce opacity-40" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Cyber grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge with neon glow */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full border border-pink-500/30 mb-10 transition-all hover:border-pink-400/50"
            style={{
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.2), inset 0 0 20px rgba(236, 72, 153, 0.05)',
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.8)' }}></span>
            </span>
            <span className="text-sm font-medium text-gray-200">Web3 Security Researcher</span>
          </div>

          {/* Title with neon glow */}
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 tracking-tight">
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500"
              style={{
                textShadow: '0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(236, 72, 153, 0.3)',
                filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.4))',
              }}
            >
              func
            </span>
            <span
              className="text-gray-700 dark:text-gray-300"
              style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}
            >
              (
            </span>
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-400"
              style={{
                textShadow: '0 0 40px rgba(6, 182, 212, 0.4), 0 0 80px rgba(236, 72, 153, 0.3)',
                filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.3))',
              }}
            >
              sikk
            </span>
            <span
              className="text-gray-700 dark:text-gray-300"
              style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}
            >
              )
            </span>
          </h1>

          {/* Subtitle - terminal style with neon */}
          <div
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/60 dark:bg-black/40 backdrop-blur-sm rounded-lg border border-pink-500/20 mb-8"
            style={{
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.1)',
            }}
          >
            <span className="text-cyan-400 font-mono text-lg">&gt;</span>
            <p className="text-xl md:text-2xl font-mono font-medium text-gray-200 tracking-wider">
              I LOVE WHAT I DO
              <span className="animate-pulse text-pink-400 ml-1">_</span>
            </p>
          </div>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-14 text-lg leading-relaxed">
            보안 연구, 취약점 분석, 그리고 더 많은 것들에 대한 기록.
            <br />
            <span
              className="text-pink-500 font-semibold"
              style={{ textShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}
            >
              나눔으로 커지는 지식
            </span>
            을 믿습니다.
          </p>

          {/* Stats with neon border */}
          <div
            className="inline-flex items-center gap-8 md:gap-14 px-10 py-8 bg-gray-900/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-pink-500/30 relative"
            style={{
              boxShadow: '0 0 40px rgba(236, 72, 153, 0.15), 0 0 80px rgba(236, 72, 153, 0.05), inset 0 0 60px rgba(236, 72, 153, 0.03)',
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-400 rounded-br-lg" />

            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center flex items-center gap-8 md:gap-14">
                <div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-xs md:text-sm text-gray-400 mt-2 font-medium uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
                {index < stats.length - 1 && (
                  <div
                    className="w-px h-14 bg-gradient-to-b from-transparent via-pink-500/50 to-transparent"
                    style={{ boxShadow: '0 0 10px rgba(236, 72, 153, 0.3)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
