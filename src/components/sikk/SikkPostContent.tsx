'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MDXContent from '@/components/mdx/MDXContent';

// Lazy load the editor to reduce initial bundle size
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
    </div>
  ),
  ssr: false,
});

interface PostMetadata {
  title: string;
  description: string;
  date: string;
  tags: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  isPublic: boolean;
  category?: string;
  thumbnail?: string;
  thumbnailPosition?: number;
  thumbnailScale?: number;
}

interface SikkPostContentProps {
  content: string;
  slug: string;
  isAdmin: boolean;
  initialMetadata?: PostMetadata;
}

export default function SikkPostContent({ content, slug, isAdmin, initialMetadata }: SikkPostContentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [metadata, setMetadata] = useState<PostMetadata>(initialMetadata || {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    status: 'not_started',
    isPublic: true,
    category: '',
    thumbnail: undefined,
    thumbnailPosition: 50,
    thumbnailScale: 100,
  });
  const [tagsInput, setTagsInput] = useState(initialMetadata?.tags.join(', ') || '');

  const handleSave = useCallback(async (markdown: string) => {
    try {
      // Parse tags from input
      const parsedTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch(`/api/sikk/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metadata.title,
          description: metadata.description,
          date: metadata.date,
          tags: parsedTags,
          status: metadata.status,
          isPublic: metadata.isPublic,
          category: metadata.category,
          thumbnail: metadata.thumbnail,
          thumbnailPosition: metadata.thumbnailPosition,
          thumbnailScale: metadata.thumbnailScale,
          content: markdown,
        }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setCurrentContent(markdown);
      setMetadata(prev => ({ ...prev, tags: parsedTags }));
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }, [slug, metadata, tagsInput, router]);

  const handleCancel = useCallback(() => {
    // Reset to initial values
    setMetadata(initialMetadata || {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      status: 'not_started',
      isPublic: true,
      category: '',
      thumbnail: undefined,
      thumbnailPosition: 50,
      thumbnailScale: 100,
    });
    setTagsInput(initialMetadata?.tags.join(', ') || '');
    setCurrentContent(content);
    setIsEditing(false);
  }, [initialMetadata, content]);

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div className="relative">
      {/* Edit Mode Toggle Button */}
      {isAdmin && !isEditing && (
        <button
          onClick={handleStartEdit}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors"
          title="인라인 편집"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">편집</span>
        </button>
      )}

      {/* Content Area */}
      {isEditing ? (
        <div className="space-y-6">
          {/* Metadata Editor */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border-2 border-pink-200 dark:border-pink-500/40 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">포스트 정보</h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                제목
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none bg-white dark:bg-gray-900"
                placeholder="포스트 제목"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                설명
              </label>
              <input
                type="text"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none bg-white dark:bg-gray-900"
                placeholder="포스트 설명"
              />
            </div>

            {/* Date and Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  날짜
                </label>
                <input
                  type="date"
                  value={metadata.date}
                  onChange={(e) => setMetadata(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none bg-white dark:bg-gray-900"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  상태
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMetadata(prev => ({ ...prev, status: 'not_started' }))}
                    className={`flex-1 px-2 py-2 text-xs rounded-lg border-2 transition-all ${
                      metadata.status === 'not_started'
                        ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    시작전
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadata(prev => ({ ...prev, status: 'in_progress' }))}
                    className={`flex-1 px-2 py-2 text-xs rounded-lg border-2 transition-all ${
                      metadata.status === 'in_progress'
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                    }`}
                  >
                    진행중
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadata(prev => ({ ...prev, status: 'completed' }))}
                    className={`flex-1 px-2 py-2 text-xs rounded-lg border-2 transition-all ${
                      metadata.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-500 text-green-800 dark:text-green-200'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-300'
                    }`}
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-pink-400 dark:focus:border-pink-500 focus:outline-none bg-white dark:bg-gray-900"
                placeholder="React, Next.js, TypeScript"
              />
            </div>

            {/* Public Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={metadata.isPublic}
                onChange={(e) => setMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
              />
              <label htmlFor="isPublic" className="text-xs text-gray-600 dark:text-gray-400">
                공개
              </label>
            </div>
          </div>

          {/* Content Editor */}
          <TipTapEditor
            content={currentContent}
            onSave={handleSave}
            onCancel={handleCancel}
            placeholder="포스트 내용을 입력하세요..."
          />
        </div>
      ) : (
        <MDXContent content={currentContent} />
      )}
    </div>
  );
}
