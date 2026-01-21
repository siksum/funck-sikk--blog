'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';

interface InlinePostEditorProps {
  post: {
    slug: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    content: string;
    date: string;
    thumbnail?: string;
    thumbnailPosition?: number;
    thumbnailScale?: number;
    isPublic?: boolean;
  };
  children: React.ReactNode;
}

export default function InlinePostEditor({ post, children }: InlinePostEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    setIsEditing(false);
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            포스트 수정
          </h2>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
        </div>
        <div className="p-4 max-w-[1600px] mx-auto">
          <PostEditor
            initialData={post}
            isEdit
            onSaveSuccess={handleSave}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Edit Button - Fixed position */}
      <button
        onClick={() => setIsEditing(true)}
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-all hover:scale-105"
        title="이 포스트 수정하기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="hidden sm:inline text-sm font-medium">수정</span>
      </button>
      {children}
    </div>
  );
}
