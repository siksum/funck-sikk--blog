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

// Web3-style 3D Mesh Sphere Component
function MeshSphere() {
  return (
    <div
      className="absolute hidden lg:block"
      style={{
        top: '10%',
        right: '5%',
        width: '320px',
        height: '320px',
        animation: 'floatSphere 8s ease-in-out infinite',
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--neon-pink-glow) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulseSphere 4s ease-in-out infinite',
        }}
      />

      {/* Main sphere with mesh pattern */}
      <div
        className="absolute inset-8 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(192, 132, 252, 0.3) 0%, transparent 50%),
            radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)
          `,
          boxShadow: `
            inset -20px -20px 60px rgba(0,0,0,0.3),
            inset 20px 20px 60px rgba(255,255,255,0.05),
            0 0 80px var(--neon-pink-glow)
          `,
        }}
      >
        {/* Mesh grid lines - horizontal */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 200"
          style={{ opacity: 0.6 }}
        >
          {/* Horizontal arcs */}
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y, i) => (
            <ellipse
              key={`h-${i}`}
              cx="100"
              cy={y}
              rx={Math.sqrt(10000 - Math.pow(y - 100, 2)) * 0.95}
              ry="3"
              fill="none"
              stroke="var(--neon-pink)"
              strokeWidth="0.5"
              opacity={0.4 + (1 - Math.abs(y - 100) / 100) * 0.4}
            />
          ))}
          {/* Vertical arcs */}
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x, i) => (
            <ellipse
              key={`v-${i}`}
              cx={x}
              cy="100"
              rx="3"
              ry={Math.sqrt(10000 - Math.pow(x - 100, 2)) * 0.95}
              fill="none"
              stroke="var(--neon-cyan)"
              strokeWidth="0.5"
              opacity={0.3 + (1 - Math.abs(x - 100) / 100) * 0.4}
            />
          ))}
        </svg>

        {/* Dot particles on sphere surface */}
        <div className="absolute inset-0">
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const radius = 35 + Math.random() * 30;
            const x = 50 + Math.cos(angle + i * 0.3) * radius * Math.sin(i * 0.2 + 1);
            const y = 50 + Math.sin(angle + i * 0.3) * radius * Math.cos(i * 0.15);
            const size = 2 + Math.random() * 3;
            const opacity = 0.3 + Math.random() * 0.5;
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: i % 3 === 0 ? 'var(--neon-pink)' : i % 3 === 1 ? 'var(--neon-cyan)' : 'var(--neon-purple)',
                  opacity,
                  boxShadow: `0 0 ${size * 2}px currentColor`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Rotating ring */}
      <div
        className="absolute inset-4 rounded-full border border-violet-500/30 dark:border-violet-400/40"
        style={{
          animation: 'rotateSphere 20s linear infinite',
          boxShadow: '0 0 20px var(--neon-pink-glow)',
        }}
      />
      <div
        className="absolute inset-2 rounded-full border border-indigo-500/20 dark:border-indigo-400/30"
        style={{
          animation: 'rotateSphere 25s linear infinite reverse',
        }}
      />

      <style jsx>{`
        @keyframes floatSphere {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulseSphere {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes rotateSphere {
          0% { transform: rotateZ(0deg); }
          100% { transform: rotateZ(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Secondary smaller sphere
function SmallMeshSphere() {
  return (
    <div
      className="absolute hidden xl:block"
      style={{
        bottom: '15%',
        left: '8%',
        width: '180px',
        height: '180px',
        animation: 'floatSmall 10s ease-in-out infinite',
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--neon-cyan-glow) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Sphere */}
      <div
        className="absolute inset-6 rounded-full overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(192, 132, 252, 0.2) 0%, transparent 50%)
          `,
          boxShadow: `
            inset -10px -10px 30px rgba(0,0,0,0.3),
            inset 10px 10px 30px rgba(255,255,255,0.05),
            0 0 40px var(--neon-cyan-glow)
          `,
        }}
      >
        {/* Dots */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 25 + Math.random() * 20;
          const x = 50 + Math.cos(angle) * radius * Math.sin(i * 0.3 + 1);
          const y = 50 + Math.sin(angle) * radius;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: '2px',
                height: '2px',
                background: i % 2 === 0 ? 'var(--neon-cyan)' : 'var(--neon-purple)',
                opacity: 0.4 + Math.random() * 0.4,
                boxShadow: '0 0 4px currentColor',
              }}
            />
          );
        })}
      </div>

      <style jsx>{`
        @keyframes floatSmall {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(15px) translateX(-10px); }
        }
      `}</style>
    </div>
  );
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
    <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-purple-500 to-violet-400 dark:from-violet-300 dark:via-purple-300 dark:to-violet-400 neon-text-pink">
      {count}
      <span className="text-lg ml-1" style={{ color: 'var(--foreground-muted)' }}>{suffix}</span>
    </span>
  );
}

export default function HeroClient({ stats }: HeroClientProps) {
  return (
    <section
      className="relative py-24 md:py-36 overflow-hidden hero-bg"
    >
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
        <div className="absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[30%] right-[25%] w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-bounce opacity-50" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-[35%] left-[35%] w-1 h-1 rounded-full bg-purple-500 dark:bg-purple-400 animate-bounce opacity-40" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-300 animate-bounce opacity-50" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
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

      {/* 3D Mesh Spheres */}
      <MeshSphere />
      <SmallMeshSphere />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 transition-all
              backdrop-blur-xl
              border border-violet-200 dark:border-violet-500/30
              shadow-lg shadow-violet-200/30 dark:shadow-violet-500/10
              hover:border-violet-300 dark:hover:border-violet-400/50"
            style={{ background: 'var(--card-bg)' }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"
                style={{ boxShadow: '0 0 10px var(--neon-pink-glow)' }}
              ></span>
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>Web3 Security Researcher</span>
          </div>

          {/* Title with neon glow */}
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 tracking-tight">
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-500 to-violet-500 dark:from-violet-300 dark:via-purple-300 dark:to-violet-400"
              style={{
                filter: 'drop-shadow(0 0 30px var(--neon-pink-glow))',
              }}
            >
              func
            </span>
            <span style={{ color: 'var(--foreground)' }}>(</span>
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 dark:from-indigo-300 dark:via-violet-300 dark:to-purple-300"
              style={{
                filter: 'drop-shadow(0 0 30px var(--neon-cyan-glow))',
              }}
            >
              sikk
            </span>
            <span style={{ color: 'var(--foreground)' }}>)</span>
          </h1>

          {/* Subtitle - terminal style */}
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-lg mb-8
              backdrop-blur-sm
              border border-gray-200 dark:border-violet-500/20
              shadow-lg dark:shadow-violet-500/5"
            style={{ background: 'var(--card-bg)' }}
          >
            <span className="font-mono text-lg" style={{ color: 'var(--neon-cyan)' }}>&gt;</span>
            <p className="text-xl md:text-2xl font-mono font-medium tracking-wider" style={{ color: 'var(--foreground)' }}>
              I LOVE WHAT I DO
              <span className="animate-pulse ml-1" style={{ color: 'var(--neon-pink)' }}>_</span>
            </p>
          </div>

          {/* Description */}
          <p className="max-w-2xl mx-auto mb-14 text-lg leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            보안 연구, 취약점 분석, 그리고 더 많은 것들에 대한 기록.
            <br />
            <span
              className="text-violet-600 dark:text-violet-300 font-semibold"
              style={{ textShadow: '0 0 20px var(--neon-pink-glow)' }}
            >
              나눔으로 커지는 지식
            </span>
            을 믿습니다.
          </p>

          {/* Stats card with neon border */}
          <div
            className="inline-flex items-center gap-8 md:gap-14 px-10 py-8 rounded-2xl relative
              backdrop-blur-xl
              border border-violet-200/50 dark:border-violet-500/60
              shadow-xl shadow-violet-200/20 dark:shadow-[0_0_30px_rgba(167,139,250,0.4)]"
            style={{ background: 'var(--card-bg)' }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-400 dark:border-violet-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 dark:border-indigo-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 dark:border-indigo-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-400 dark:border-violet-400 rounded-br-lg" />

            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center flex items-center gap-8 md:gap-14">
                <div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-xs md:text-sm mt-2 font-medium uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>
                    {stat.label}
                  </p>
                </div>
                {index < stats.length - 1 && (
                  <div
                    className="w-px h-14 bg-gradient-to-b from-transparent via-violet-400/50 to-transparent"
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
