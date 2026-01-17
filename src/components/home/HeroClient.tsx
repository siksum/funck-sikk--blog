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
    <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
      {count}
      <span className="text-lg ml-1">{suffix}</span>
    </span>
  );
}

export default function HeroClient({ stats }: HeroClientProps) {
  return (
    <section className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Funck Sikk Blog
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            I LOVE WHAT I DO
          </p>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-12">
            개발, 기술, 그리고 더 많은 것들에 대한 기록.
            <br />
            배움의 여정을 함께 나누는 공간입니다.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
