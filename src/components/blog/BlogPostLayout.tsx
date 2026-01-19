'use client';

import { useState, useEffect } from 'react';
import { Post, Category } from '@/types';
import BlogPostSidebar from './BlogPostSidebar';

interface BlogPostLayoutProps {
  children: React.ReactNode;
  content: string;
  tags: string[];
  category: string;
  relatedPosts: Post[];
  categories: Category[];
  currentCategorySlugPath?: string[];
}

export default function BlogPostLayout({
  children,
  content,
  tags,
  category,
  relatedPosts,
  categories,
  currentCategorySlugPath,
}: BlogPostLayoutProps) {
  const [isWide, setIsWide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('blog-width-preference');
    if (saved === 'wide') {
      setIsWide(true);
    }
  }, []);

  const toggleWidth = () => {
    setIsWide((prev) => {
      const newValue = !prev;
      localStorage.setItem('blog-width-preference', newValue ? 'wide' : 'normal');
      return newValue;
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Sidebar - Left (Fixed Width) */}
          <div className="hidden lg:block lg:w-64 xl:w-72 lg:flex-shrink-0 self-stretch">
            <div className="sticky top-20">
              <BlogPostSidebar
                content={content}
                tags={tags}
                category={category}
                relatedPosts={relatedPosts}
                categories={categories}
                currentCategorySlugPath={currentCategorySlugPath}
              />
            </div>
          </div>

          {/* Main Content (Flexible Width) */}
          <article className={`flex-1 transition-all duration-300 ${isWide ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
            {/* Width Toggle Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleWidth}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors hover:border-violet-500"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)'
                }}
                title={isWide ? '좁게 보기' : '넓게 보기'}
              >
                {mounted && (
                  <>
                    {isWide ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                          />
                        </svg>
                        <span>좁게 보기</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                          />
                        </svg>
                        <span>넓게 보기</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
