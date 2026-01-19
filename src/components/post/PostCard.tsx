'use client';

import Link from 'next/link';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'compact' | 'list';
  commentCount?: number;
}

export default function PostCard({ post, variant = 'default', commentCount = 0 }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/blog/${post.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: url,
        });
      } catch {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (variant === 'compact') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="block group p-4 transition-colors hover:bg-violet-50 dark:hover:bg-violet-500/10"
      >
        <h3
          className="text-sm font-medium group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2"
          style={{ color: 'var(--foreground)' }}
        >
          {post.title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
          {formattedDate}
        </p>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <article
        className="group rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-xl
          border border-gray-200 dark:border-violet-500/30
          hover:border-violet-300 dark:hover:border-violet-400/60
          hover:shadow-lg hover:shadow-violet-200/20 dark:hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]"
        style={{ background: 'var(--card-bg)' }}
      >
        <Link href={`/blog/${post.slug}`} className="flex">
          {/* Thumbnail */}
          {post.thumbnail ? (
            <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div
              className="relative w-32 h-24 flex-shrink-0 overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--violet-100) 0%, var(--indigo-100) 100%)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          )}

          <div className="flex-1 p-4">
            {/* Category Breadcrumb */}
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {post.categoryPath.map((name, index) => (
                <span key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-2.5 h-2.5 mx-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  <span
                    className="px-1.5 py-0.5 text-xs font-medium rounded border border-violet-200 dark:border-violet-500/40"
                    style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                  >
                    {name}
                  </span>
                </span>
              ))}
            </div>

            {/* Title */}
            <h2
              className="text-base font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-1 line-clamp-1"
              style={{ color: 'var(--foreground)' }}
            >
              {post.title}
            </h2>

            {/* Description */}
            <p
              className="text-xs line-clamp-1 mb-2"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {post.description}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--foreground-muted)' }}>
              <div className="flex items-center gap-3">
                <time dateTime={post.date}>{formattedDate}</time>
                <div className="flex gap-1">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Comment Count */}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {commentCount}
                </span>
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  aria-label="공유하기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className="group rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-xl
        border border-gray-200 dark:border-violet-500/30
        hover:border-violet-300 dark:hover:border-violet-400/60
        hover:shadow-lg hover:shadow-violet-200/20 dark:hover:shadow-[0_0_20px_rgba(167,139,250,0.2)]
        hover:-translate-y-1"
      style={{ background: 'var(--card-bg)' }}
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Thumbnail */}
        {post.thumbnail ? (
          <div className="relative w-full h-36 overflow-hidden">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="relative w-full h-36 overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--violet-100) 0%, var(--indigo-100) 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Category Breadcrumb */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {post.categoryPath.map((name, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-2.5 h-2.5 mx-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                <span
                  className="px-1.5 py-0.5 text-xs font-medium rounded border border-violet-200 dark:border-violet-500/40"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  {name}
                </span>
              </span>
            ))}
          </div>

          {/* Title */}
          <h2
            className="text-base font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors mb-1 line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {post.title}
          </h2>

          {/* Description */}
          <p
            className="text-sm line-clamp-2 mb-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {post.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
            <div className="flex items-center justify-between">
              <time dateTime={post.date}>{formattedDate}</time>
              <div className="flex items-center gap-2">
                {/* Comment Count */}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {commentCount}
                </span>
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  aria-label="공유하기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-500/40"
                  style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
