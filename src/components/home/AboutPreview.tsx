'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AboutPreview() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <Link href="/about" className="block group perspective-1000">
      <div
        className="relative bg-gray-900/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl py-12 px-8 md:py-16 md:px-12 overflow-hidden transition-all duration-300 border border-pink-500/20 hover:border-pink-400/40"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          boxShadow: '0 0 40px rgba(236, 72, 153, 0.15), 0 0 80px rgba(236, 72, 153, 0.05), 0 25px 50px rgba(0, 0, 0, 0.3)',
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated neon gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-pink-400/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-pink-400/60 rounded-br-xl" />

        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Profile Avatar with neon glow */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center text-2xl md:text-3xl font-bold shrink-0 text-white relative"
            style={{
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(236, 72, 153, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              transform: 'translateZ(20px)',
            }}
          >
            {/* Rotating ring */}
            <div
              className="absolute inset-[-4px] rounded-full border-2 border-transparent animate-spin"
              style={{
                animationDuration: '8s',
                background: 'linear-gradient(0deg, transparent 40%, rgba(6, 182, 212, 0.5) 50%, transparent 60%) border-box',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />
            NK
          </div>

          {/* Content */}
          <div className="text-left flex-1" style={{ transform: 'translateZ(10px)' }}>
            <h3
              className="text-2xl md:text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-white"
              style={{ textShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
            >
              Namryeong Kim
            </h3>
            <p className="text-gray-400 text-base mb-2 max-w-xl">
              M.S. Candidate in Convergence Security Engineering.
            </p>
            <p className="text-gray-400 text-base mb-4 max-w-xl">
              Web3 Security, AI Security, 그리고 자동화된 취약점 탐지를 연구합니다.
            </p>
            <div className="flex flex-wrap justify-start gap-2">
              {['Web3 Security', 'AI Security', 'Smart Contract'].map((tag, index) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: index === 0 ? 'rgba(236, 72, 153, 0.2)' : index === 1 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    color: index === 0 ? '#f472b6' : index === 1 ? '#22d3ee' : '#c084fc',
                    border: `1px solid ${index === 0 ? 'rgba(236, 72, 153, 0.3)' : index === 1 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                    boxShadow: index === 0 ? '0 0 10px rgba(236, 72, 153, 0.2)' : index === 1 ? '0 0 10px rgba(6, 182, 212, 0.2)' : '0 0 10px rgba(168, 85, 247, 0.2)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow with neon glow */}
          <div
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500/30 group-hover:bg-pink-500/30 group-hover:border-pink-400/50 transition-all shrink-0"
            style={{
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.2)',
              transform: 'translateZ(15px)',
            }}
          >
            <svg
              className="w-6 h-6 text-pink-400 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.8))' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
