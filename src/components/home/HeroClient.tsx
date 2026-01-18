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

// 3D Floating Cube Component
function FloatingCube() {
  return (
    <div
      className="absolute hidden lg:block"
      style={{
        top: '15%',
        right: '8%',
        perspective: '1000px',
        animation: 'float 6s ease-in-out infinite',
      }}
    >
      <div
        className="w-16 h-16 relative"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'rotateCube 10s linear infinite',
        }}
      >
        {/* Cube faces */}
        {[
          { transform: 'translateZ(32px)', bg: 'from-pink-500/40 to-pink-600/40' },
          { transform: 'rotateY(180deg) translateZ(32px)', bg: 'from-pink-400/30 to-pink-500/30' },
          { transform: 'rotateY(90deg) translateZ(32px)', bg: 'from-cyan-500/40 to-cyan-600/40' },
          { transform: 'rotateY(-90deg) translateZ(32px)', bg: 'from-cyan-400/30 to-cyan-500/30' },
          { transform: 'rotateX(90deg) translateZ(32px)', bg: 'from-purple-500/40 to-purple-600/40' },
          { transform: 'rotateX(-90deg) translateZ(32px)', bg: 'from-purple-400/30 to-purple-500/30' },
        ].map((face, i) => (
          <div
            key={i}
            className={`absolute w-16 h-16 bg-gradient-to-br ${face.bg} backdrop-blur-sm border border-white/20 dark:border-white/10`}
            style={{
              transform: face.transform,
              boxShadow: '0 0 20px var(--neon-pink-glow)',
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes rotateCube {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// 3D Floating Ring Component
function FloatingRing() {
  return (
    <div
      className="absolute hidden lg:block"
      style={{
        bottom: '20%',
        left: '5%',
        perspective: '1000px',
        animation: 'floatReverse 7s ease-in-out infinite',
      }}
    >
      <div
        className="w-20 h-20 rounded-full border-4 border-cyan-400/50 dark:border-cyan-400/70"
        style={{
          boxShadow: '0 0 30px var(--neon-cyan-glow), inset 0 0 20px var(--neon-cyan-glow)',
          animation: 'rotateRing 8s linear infinite',
          transformStyle: 'preserve-3d',
        }}
      />
      <style jsx>{`
        @keyframes rotateRing {
          0% { transform: rotateX(70deg) rotateZ(0deg); }
          100% { transform: rotateX(70deg) rotateZ(360deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(15px) translateX(10px); }
        }
      `}</style>
    </div>
  );
}

// 3D Terminal Mockup Component
function TerminalMockup() {
  return (
    <div
      className="absolute hidden xl:block"
      style={{
        top: '25%',
        right: '3%',
        perspective: '1500px',
        animation: 'floatTerminal 8s ease-in-out infinite',
      }}
    >
      <div
        className="w-64 rounded-xl overflow-hidden backdrop-blur-xl"
        style={{
          transform: 'rotateY(-15deg) rotateX(5deg)',
          transformStyle: 'preserve-3d',
          boxShadow: '0 0 40px var(--neon-pink-glow), 0 25px 50px rgba(0,0,0,0.3)',
        }}
      >
        {/* Terminal header */}
        <div className="bg-gray-800/90 dark:bg-gray-900/90 px-4 py-2 flex items-center gap-2 border-b border-gray-700/50">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-gray-400 font-mono">security.sol</span>
        </div>
        {/* Terminal content */}
        <div className="bg-gray-900/95 dark:bg-black/90 p-4 font-mono text-xs leading-relaxed">
          <div className="text-purple-400">
            <span className="text-pink-400">contract</span> Vault {'{'}
          </div>
          <div className="pl-4 text-gray-300">
            <span className="text-cyan-400">mapping</span>(address =&gt; uint)
          </div>
          <div className="pl-6 text-gray-400">balances;</div>
          <div className="text-gray-300 mt-2 pl-4">
            <span className="text-pink-400">function</span>{' '}
            <span className="text-cyan-400">withdraw</span>() {'{'}
          </div>
          <div className="pl-6 text-yellow-400/80">
            // <span className="text-pink-300 animate-pulse">vulnerability?</span>
          </div>
          <div className="pl-4 text-gray-300">{'}'}</div>
          <div className="text-purple-400">{'}'}</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes floatTerminal {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}

// 3D Shield Component
function FloatingShield() {
  return (
    <div
      className="absolute hidden lg:block"
      style={{
        top: '60%',
        left: '8%',
        perspective: '1000px',
        animation: 'floatShield 5s ease-in-out infinite',
      }}
    >
      <div
        className="relative"
        style={{
          transform: 'rotateY(20deg)',
          animation: 'pulseShield 3s ease-in-out infinite',
        }}
      >
        <svg
          width="48"
          height="56"
          viewBox="0 0 24 28"
          fill="none"
          className="text-pink-500 dark:text-pink-400"
          style={{
            filter: 'drop-shadow(0 0 15px var(--neon-pink-glow))',
          }}
        >
          <path
            d="M12 2L3 6V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V6L12 2Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <style jsx>{`
        @keyframes floatShield {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes pulseShield {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Floating Hexagon Component
function FloatingHexagon() {
  return (
    <div
      className="absolute hidden md:block"
      style={{
        bottom: '30%',
        right: '12%',
        animation: 'floatHex 6s ease-in-out infinite',
      }}
    >
      <svg
        width="40"
        height="44"
        viewBox="0 0 40 44"
        fill="none"
        className="text-purple-500/60 dark:text-purple-400/60"
        style={{
          filter: 'drop-shadow(0 0 10px var(--neon-purple-glow))',
          animation: 'rotateHex 12s linear infinite',
        }}
      >
        <path
          d="M20 2L37 12V32L20 42L3 32V12L20 2Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          fillOpacity="0.1"
        />
      </svg>
      <style jsx>{`
        @keyframes floatHex {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes rotateHex {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
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

      {/* 3D Mockup Elements */}
      <FloatingCube />
      <FloatingRing />
      <TerminalMockup />
      <FloatingShield />
      <FloatingHexagon />

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
