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
    <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 dark:from-pink-400 dark:via-rose-400 dark:to-pink-500 neon-text-pink">
      {count}
      <span className="text-lg ml-1 text-gray-500 dark:text-gray-400">{suffix}</span>
    </span>
  );
}

export default function HeroClient({ stats }: HeroClientProps) {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden bg-gradient-to-br from-gray-50 via-pink-50/30 to-cyan-50/20 dark:from-[#0a0a0f] dark:via-[#0d0d14] dark:to-[#0a0a0f]">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb - Pink */}
        <div
          className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse opacity-40 dark:opacity-50"
          style={{
            background: 'radial-gradient(circle, var(--neon-pink) 0%, transparent 70%)',
          }}
        />
        {/* Secondary orb - Cyan */}
        <div
          className="absolute -bottom-20 left-[5%] w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse opacity-30 dark:opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--neon-cyan) 0%, transparent 70%)',
            animationDelay: '1s',
          }}
        />
        {/* Tertiary orb - Purple */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, var(--neon-purple) 0%, transparent 60%)',
          }}
        />

        {/* Floating particles */}
        <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400 animate-bounce opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[30%] right-[25%] w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-bounce opacity-50" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-[35%] left-[35%] w-1 h-1 rounded-full bg-purple-500 dark:bg-purple-400 animate-bounce opacity-40" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 rounded-full bg-pink-400 dark:bg-pink-300 animate-bounce opacity-50" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(var(--neon-pink) 1px, transparent 1px),
            linear-gradient(90deg, var(--neon-pink) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanline effect - dark mode only */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />


      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 transition-all
              bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
              border border-pink-200 dark:border-pink-500/30
              shadow-lg shadow-pink-200/30 dark:shadow-pink-500/10
              hover:border-pink-300 dark:hover:border-pink-400/50"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"
                style={{ boxShadow: '0 0 10px var(--neon-pink-glow)' }}
              ></span>
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Web3 Security Researcher</span>
          </div>

          {/* Title with neon glow */}
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 tracking-tight">
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 dark:from-pink-400 dark:via-rose-400 dark:to-pink-500"
              style={{
                filter: 'drop-shadow(0 0 30px var(--neon-pink-glow))',
              }}
            >
              func
            </span>
            <span className="text-gray-800 dark:text-gray-300">(</span>
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-pink-500 to-rose-500 dark:from-cyan-400 dark:via-pink-400 dark:to-rose-400"
              style={{
                filter: 'drop-shadow(0 0 30px var(--neon-cyan-glow))',
              }}
            >
              sikk
            </span>
            <span className="text-gray-800 dark:text-gray-300">)</span>
          </h1>

          {/* Subtitle - terminal style */}
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-lg mb-8
              bg-gray-100/80 dark:bg-gray-900/60 backdrop-blur-sm
              border border-gray-200 dark:border-pink-500/20
              shadow-lg dark:shadow-pink-500/5"
          >
            <span className="text-cyan-600 dark:text-cyan-400 font-mono text-lg">&gt;</span>
            <p className="text-xl md:text-2xl font-mono font-medium text-gray-700 dark:text-gray-200 tracking-wider">
              I LOVE WHAT I DO
              <span className="animate-pulse text-pink-500 dark:text-pink-400 ml-1">_</span>
            </p>
          </div>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-14 text-lg leading-relaxed">
            보안 연구, 취약점 분석, 그리고 더 많은 것들에 대한 기록.
            <br />
            <span
              className="text-pink-600 dark:text-pink-400 font-semibold"
              style={{ textShadow: '0 0 20px var(--neon-pink-glow)' }}
            >
              나눔으로 커지는 지식
            </span>
            을 믿습니다.
          </p>

          {/* Stats card with neon border */}
          <div
            className="inline-flex items-center gap-8 md:gap-14 px-10 py-8 rounded-2xl relative
              bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl
              border border-pink-200/50 dark:border-pink-500/30
              shadow-xl shadow-pink-200/20 dark:shadow-pink-500/10"
            style={{
              boxShadow: '0 0 40px var(--neon-pink-glow), 0 25px 50px var(--card-shadow)',
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-400 dark:border-pink-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 dark:border-cyan-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 dark:border-cyan-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-400 dark:border-pink-400 rounded-br-lg" />

            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center flex items-center gap-8 md:gap-14">
                <div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
                {index < stats.length - 1 && (
                  <div
                    className="w-px h-14 bg-gradient-to-b from-transparent via-pink-400/50 to-transparent"
                    style={{ boxShadow: '0 0 10px var(--neon-pink-glow)' }}
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
