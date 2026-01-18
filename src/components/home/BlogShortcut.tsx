'use client';

import Link from 'next/link';
import { useState } from 'react';

interface BlogShortcutProps {
  postCount: number;
  categoryCount: number;
  tagCount: number;
}

export default function BlogShortcut({ postCount, categoryCount, tagCount }: BlogShortcutProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  const stats = [
    { value: postCount, label: '포스트', color: 'pink' },
    { value: categoryCount, label: '카테고리', color: 'cyan' },
    { value: tagCount, label: '태그', color: 'purple' },
  ];

  return (
    <Link href="/blog" className="block group">
      <div
        className="relative bg-gray-900/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl py-12 px-8 md:py-16 md:px-12 overflow-hidden transition-all duration-300 border border-cyan-500/20 hover:border-cyan-400/40"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.1), 0 0 80px rgba(236, 72, 153, 0.05), 0 25px 50px rgba(0, 0, 0, 0.3)',
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-pink-400/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-pink-400/60 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-xl" />

        {/* Animated grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Content */}
          <div className="text-left" style={{ transform: 'translateZ(10px)' }}>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-start gap-3">
              {/* Neon book icon */}
              <div
                className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center"
                style={{ boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' }}
              >
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8))' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-400"
                style={{ textShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}
              >
                Blog
              </span>
            </h3>
            <p className="text-gray-400 text-base mb-6 max-w-md">
              개발, 기술, 그리고 더 많은 것들에 대한 기록.
              <br />
              배움의 여정을 함께 나누는 공간입니다.
            </p>
            <span
              className="inline-flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors font-medium"
              style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
            >
              모든 글 보기
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>

          {/* Stats with neon effect */}
          <div className="flex gap-6 md:gap-10" style={{ transform: 'translateZ(15px)' }}>
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center px-4 py-3 rounded-xl bg-gray-800/50 border transition-all hover:scale-105"
                style={{
                  borderColor: stat.color === 'pink' ? 'rgba(236, 72, 153, 0.3)' : stat.color === 'cyan' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)',
                  boxShadow: stat.color === 'pink' ? '0 0 20px rgba(236, 72, 153, 0.1)' : stat.color === 'cyan' ? '0 0 20px rgba(6, 182, 212, 0.1)' : '0 0 20px rgba(168, 85, 247, 0.1)',
                }}
              >
                <p
                  className="text-3xl md:text-4xl font-bold"
                  style={{
                    color: stat.color === 'pink' ? '#f472b6' : stat.color === 'cyan' ? '#22d3ee' : '#c084fc',
                    textShadow: stat.color === 'pink' ? '0 0 20px rgba(236, 72, 153, 0.5)' : stat.color === 'cyan' ? '0 0 20px rgba(6, 182, 212, 0.5)' : '0 0 20px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-gray-400 text-sm mt-1 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
