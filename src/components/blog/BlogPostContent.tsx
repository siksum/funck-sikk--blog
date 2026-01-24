'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MDXContent from '@/components/mdx/MDXContent';

// Lazy load the editor to reduce initial bundle size
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  ),
  ssr: false,
});

interface PostMetadata {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  thumbnail?: string;
  thumbnailPosition?: number;
  thumbnailScale?: number;
}

interface BlogPostContentProps {
  content: string;
  slug: string;
  isAdmin: boolean;
  initialMetadata?: PostMetadata;
}

export default function BlogPostContent({ content, slug, isAdmin, initialMetadata }: BlogPostContentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);
  const [metadata, setMetadata] = useState<PostMetadata>(initialMetadata || {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    category: '',
    isPublic: true,
    thumbnail: undefined,
    thumbnailPosition: 50,
    thumbnailScale: 100,
  });
  const [tagsInput, setTagsInput] = useState(initialMetadata?.tags.join(', ') || '');

  const handleSave = useCallback(async (html: string) => {
    try {
      // Parse tags from input
      const parsedTags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metadata.title,
          description: metadata.description,
          date: metadata.date,
          tags: parsedTags,
          category: metadata.category,
          isPublic: metadata.isPublic,
          thumbnail: metadata.thumbnail,
          thumbnailPosition: metadata.thumbnailPosition,
          thumbnailScale: metadata.thumbnailScale,
          content: html,
        }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setCurrentContent(html);
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
      category: '',
      isPublic: true,
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
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-full shadow-lg hover:bg-violet-600 transition-colors"
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
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur border-2 border-violet-200 dark:border-violet-500/40 rounded-lg p-4 space-y-4">
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
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
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
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
                placeholder="포스트 설명"
              />
            </div>

            {/* Date and Category Row */}
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
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  카테고리
                </label>
                <input
                  type="text"
                  value={metadata.category}
                  onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
                  placeholder="카테고리"
                />
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
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
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
                className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-500"
              />
              <label htmlFor="isPublic" className="text-xs text-gray-600 dark:text-gray-400">
                공개
              </label>
            </div>

            {/* Banner Image Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                배너 이미지
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={metadata.thumbnail || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-violet-400 dark:focus:border-violet-500 focus:outline-none bg-white dark:bg-gray-900"
                  placeholder="이미지 URL 또는 파일 업로드"
                />
                <label className="px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors cursor-pointer flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  업로드
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Check file size (max 50MB)
                      if (file.size > 50 * 1024 * 1024) {
                        alert('파일이 너무 큽니다. 50MB 이하의 이미지를 사용해주세요.');
                        return;
                      }
                      try {
                        // Upload to Google Drive
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);

                        const response = await fetch('/api/upload/drive', {
                          method: 'POST',
                          body: formDataUpload,
                        });

                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.error || '업로드 실패');
                        }

                        const data = await response.json();
                        setMetadata(prev => ({ ...prev, thumbnail: data.url }));
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert(`이미지 업로드 실패: ${error instanceof Error ? error.message : '네트워크 오류'}`);
                      } finally {
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
                {metadata.thumbnail && (
                  <button
                    type="button"
                    onClick={() => setMetadata(prev => ({ ...prev, thumbnail: '', thumbnailPosition: 50, thumbnailScale: 100 }))}
                    className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                )}
              </div>
              {metadata.thumbnail && (
                <div className="mt-3 space-y-3">
                  {/* Banner preview */}
                  <div
                    className="relative h-48 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700"
                    style={{
                      backgroundImage: `url(${metadata.thumbnail})`,
                      backgroundSize: `${metadata.thumbnailScale || 100}%`,
                      backgroundPosition: `center ${metadata.thumbnailPosition || 50}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      미리보기
                    </div>
                  </div>
                  {/* Position adjustment */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">위치</span>
                    <button
                      type="button"
                      onClick={() => setMetadata(prev => ({ ...prev, thumbnailPosition: Math.max(0, (prev.thumbnailPosition || 50) - 10) }))}
                      className="p-1 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metadata.thumbnailPosition || 50}
                      onChange={(e) => setMetadata(prev => ({ ...prev, thumbnailPosition: Number(e.target.value) }))}
                      className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setMetadata(prev => ({ ...prev, thumbnailPosition: Math.min(100, (prev.thumbnailPosition || 50) + 10) }))}
                      className="p-1 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{metadata.thumbnailPosition || 50}%</span>
                  </div>
                  {/* Scale adjustment */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">배율</span>
                    <button
                      type="button"
                      onClick={() => setMetadata(prev => ({ ...prev, thumbnailScale: Math.max(50, (prev.thumbnailScale || 100) - 10) }))}
                      className="p-1 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={metadata.thumbnailScale || 100}
                      onChange={(e) => setMetadata(prev => ({ ...prev, thumbnailScale: Number(e.target.value) }))}
                      className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setMetadata(prev => ({ ...prev, thumbnailScale: Math.min(200, (prev.thumbnailScale || 100) + 10) }))}
                      className="p-1 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{metadata.thumbnailScale || 100}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <TipTapEditor
            content={currentContent}
            onSave={handleSave}
            onChange={setCurrentContent}
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
