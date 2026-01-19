'use client';

import { ReactNode } from 'react';

type CalloutType = 'info' | 'warning' | 'tip' | 'danger' | 'note';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig = {
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '정보',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    borderColor: 'border-blue-500 dark:border-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    titleColor: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: '주의',
    bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
    borderColor: 'border-yellow-500 dark:border-yellow-400',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    titleColor: 'text-yellow-700 dark:text-yellow-300',
  },
  tip: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: '팁',
    bgColor: 'bg-green-50 dark:bg-green-500/10',
    borderColor: 'border-green-500 dark:border-green-400',
    iconColor: 'text-green-500 dark:text-green-400',
    titleColor: 'text-green-700 dark:text-green-300',
  },
  danger: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '위험',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
    borderColor: 'border-red-500 dark:border-red-400',
    iconColor: 'text-red-500 dark:text-red-400',
    titleColor: 'text-red-700 dark:text-red-300',
  },
  note: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: '노트',
    bgColor: 'bg-violet-50 dark:bg-violet-500/10',
    borderColor: 'border-violet-500 dark:border-violet-400',
    iconColor: 'text-violet-500 dark:text-violet-400',
    titleColor: 'text-violet-700 dark:text-violet-300',
  },
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const displayTitle = title || config.title;

  return (
    <div className={`my-6 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={config.iconColor}>{config.icon}</span>
        <span className={`font-semibold ${config.titleColor}`}>{displayTitle}</span>
      </div>
      <div className="ml-7 text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}
