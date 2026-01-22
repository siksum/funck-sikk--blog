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

interface DatabaseItemContentProps {
  databaseId: string;
  itemId: string;
  content: string;
  isAdmin: boolean;
}

export default function DatabaseItemContent({
  databaseId,
  itemId,
  content,
  isAdmin,
}: DatabaseItemContentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);

  const handleSave = useCallback(async (html: string) => {
    try {
      const response = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: html }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setCurrentContent(html);
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }, [databaseId, itemId, router]);

  const handleCancel = useCallback(() => {
    setCurrentContent(content);
    setIsEditing(false);
  }, [content]);

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
        <TipTapEditor
          content={currentContent}
          onSave={handleSave}
          onChange={setCurrentContent}
          onCancel={handleCancel}
          placeholder="내용을 입력하세요..."
        />
      ) : currentContent ? (
        <MDXContent content={currentContent} />
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>아직 내용이 없습니다.</p>
          {isAdmin && (
            <button
              onClick={handleStartEdit}
              className="mt-4 px-4 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              내용 작성하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
