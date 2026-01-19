'use client';

import { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  readingTime?: number;
}

export default function ReadingProgressBar({ readingTime }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(readingTime || 0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollProgress);

      // Calculate remaining time
      if (readingTime) {
        const remaining = Math.ceil(readingTime * (1 - scrollProgress / 100));
        setRemainingTime(remaining);
      }
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, [readingTime]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-400 transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Remaining Time Indicator */}
      {readingTime && progress > 5 && progress < 95 && (
        <div
          className="absolute right-4 top-3 px-2 py-1 rounded-full text-xs font-medium shadow-lg animate-fade-in"
          style={{ background: 'var(--card-bg)', color: 'var(--foreground-muted)' }}
        >
          약 {remainingTime}분 남음
        </div>
      )}
    </div>
  );
}
