'use client';

import { useState, useEffect } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  variant?: 'default' | 'sidebar';
}

export default function TableOfContents({ content, variant = 'default' }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<TOCItem[]>([]);

  useEffect(() => {
    // Parse headings from markdown content
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')  // Preserve Korean characters
        .replace(/\s+/g, '-');

      items.push({ id, text, level });
    }

    setHeadings(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // Sidebar variant - always visible, compact
  if (variant === 'sidebar') {
    const getEmoji = (level: number) => {
      switch (level) {
        case 1:
          return '💜';
        case 2:
          return '💗';
        case 3:
          return '🤍';
        default:
          return '♡';
      }
    };

    return (
      <nav className="max-h-[60vh] overflow-y-auto">
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
            >
              <button
                onClick={() => handleClick(heading.id)}
                className={`text-left text-sm leading-relaxed transition-colors hover:text-violet-600 dark:hover:text-violet-400 flex items-start gap-1.5 ${
                  activeId === heading.id
                    ? 'text-violet-600 dark:text-violet-400 font-medium'
                    : ''
                }`}
                style={{ color: activeId === heading.id ? undefined : 'var(--foreground-muted)' }}
              >
                <span className="flex-shrink-0">{getEmoji(heading.level)}</span>
                <span>{heading.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  // Default variant - collapsible
  return (
    <div
      className="mb-8 rounded-xl border overflow-hidden"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold" style={{ color: 'var(--foreground)' }}>
          <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          목차
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--foreground-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <nav className="px-5 pb-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <ul className="pt-4 space-y-2">
            {headings.map((heading) => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <button
                  onClick={() => handleClick(heading.id)}
                  className={`text-left text-sm transition-colors hover:text-violet-600 dark:hover:text-violet-400 ${
                    activeId === heading.id
                      ? 'text-violet-600 dark:text-violet-400 font-medium'
                      : ''
                  }`}
                  style={{ color: activeId === heading.id ? undefined : 'var(--foreground-muted)' }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
