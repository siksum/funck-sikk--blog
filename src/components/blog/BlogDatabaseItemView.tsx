'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MDXContent from '@/components/mdx/MDXContent';

const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
    </div>
  ),
  ssr: false,
});

interface Column {
  id: string;
  name: string;
  type: string;
  options?: string[];
}

interface BlogDatabaseItemViewProps {
  databaseId: string;
  databaseSlug: string;
  databaseTitle: string;
  itemId: string;
  columns: Column[];
  data: Record<string, unknown>;
  content: string;
  isAdmin: boolean;
}

export default function BlogDatabaseItemView({
  databaseId,
  databaseSlug,
  databaseTitle,
  itemId,
  columns,
  data: initialData,
  content: initialContent,
  isAdmin,
}: BlogDatabaseItemViewProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [content, setContent] = useState(initialContent);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const titleColumn = columns.find((c) => c.type === 'title');
  const title = titleColumn ? String(data[titleColumn.id] || '제목 없음') : '제목 없음';

  const handleSaveContent = useCallback(async (html: string) => {
    try {
      const response = await fetch(`/api/blog/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      });

      if (!response.ok) throw new Error('저장 실패');

      setContent(html);
      setIsEditingContent(false);
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }, [databaseId, itemId, router]);

  const handleUpdateField = useCallback(async (columnId: string, value: unknown) => {
    try {
      const response = await fetch(`/api/blog/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...data, [columnId]: value } }),
      });

      if (!response.ok) throw new Error('저장 실패');

      setData((prev) => ({ ...prev, [columnId]: value }));
      setEditingField(null);
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
    }
  }, [databaseId, itemId, data, router]);

  const startEditingField = (columnId: string, currentValue: unknown) => {
    if (!isAdmin) return;
    setEditingField(columnId);
    setEditValue(String(currentValue || ''));
  };

  const handleFileUpload = useCallback(async (columnId: string, files: FileList) => {
    setUploadingFile(true);

    const existingFiles = Array.isArray(data[columnId]) ? data[columnId] as string[] : [];
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          uploadedUrls.push(result.url);
        }
      }

      const newFiles = [...existingFiles, ...uploadedUrls];
      await handleUpdateField(columnId, newFiles);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  }, [data, handleUpdateField]);

  const handleRemoveFile = useCallback(async (columnId: string, fileUrl: string) => {
    const existingFiles = Array.isArray(data[columnId]) ? data[columnId] as string[] : [];
    const newFiles = existingFiles.filter((f) => f !== fileUrl);
    await handleUpdateField(columnId, newFiles);
  }, [data, handleUpdateField]);

  const renderFieldEditor = (column: Column) => {
    if (editingField !== column.id) return null;

    if (column.type === 'select') {
      return (
        <select
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            handleUpdateField(column.id, e.target.value);
          }}
          className="px-2 py-1 text-sm border border-violet-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          autoFocus
        >
          <option value="">선택...</option>
          {(column.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (column.type === 'date') {
      return (
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleUpdateField(column.id, editValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateField(column.id, editValue);
            if (e.key === 'Escape') setEditingField(null);
          }}
          className="px-2 py-1 text-sm border border-violet-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          autoFocus
        />
      );
    }

    return (
      <input
        type={column.type === 'url' ? 'url' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleUpdateField(column.id, editValue);
          if (e.key === 'Escape') setEditingField(null);
        }}
        onBlur={() => handleUpdateField(column.id, editValue)}
        className="flex-1 px-2 py-1 text-sm border border-violet-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        autoFocus
      />
    );
  };

  const renderFieldValue = (column: Column) => {
    const value = data[column.id];

    if (column.type === 'files') {
      const files = Array.isArray(value) ? value as string[] : [];
      return (
        <div className="flex flex-wrap gap-2 items-center">
          {files.map((file, i) => (
            <div key={i} className="relative group inline-flex items-center">
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[150px] hover:bg-gray-200 dark:hover:bg-gray-600"
                title={file}
              >
                {file.split('/').pop()}
              </a>
              {isAdmin && (
                <button
                  onClick={() => handleRemoveFile(column.id, file)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {isAdmin && (
            <label className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
              {uploadingFile ? (
                <span className="animate-pulse">업로드 중...</span>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>파일 추가</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(column.id, e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </>
              )}
            </label>
          )}
          {files.length === 0 && !isAdmin && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      );
    }

    if (column.type === 'url' && value) {
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      );
    }

    return value ? String(value) : <span className="text-gray-400">-</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center text-sm mb-4" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/blog/db/${databaseSlug}`}
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            {databaseTitle}
          </Link>
        </div>

        {/* Editable Title */}
        {titleColumn && (
          editingField === titleColumn.id ? (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 text-3xl font-bold px-2 py-1 border-2 border-violet-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateField(titleColumn.id, editValue);
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
              <button
                onClick={() => handleUpdateField(titleColumn.id, editValue)}
                className="px-3 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
              >
                저장
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          ) : (
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${isAdmin ? 'cursor-pointer hover:text-violet-600 dark:hover:text-violet-400' : ''}`}
              style={{ color: 'var(--foreground)' }}
              onClick={() => isAdmin && startEditingField(titleColumn.id, data[titleColumn.id])}
              title={isAdmin ? '클릭하여 편집' : undefined}
            >
              {title}
            </h1>
          )
        )}

        {/* Editable Metadata Fields */}
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          {columns
            .filter((c) => c.type !== 'title')
            .map((column) => (
              <div key={column.id} className="flex items-center gap-1">
                <span className="font-medium">{column.name}:</span>
                {editingField === column.id ? (
                  <div className="flex items-center gap-1">
                    {renderFieldEditor(column)}
                    {column.type !== 'select' && (
                      <>
                        <button
                          onClick={() => handleUpdateField(column.id, editValue)}
                          className="px-2 py-0.5 bg-violet-500 text-white rounded text-xs hover:bg-violet-600"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-2 py-0.5 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span
                    className={isAdmin && column.type !== 'files' ? 'cursor-pointer hover:text-violet-600 dark:hover:text-violet-400' : ''}
                    onClick={() => column.type !== 'files' && startEditingField(column.id, data[column.id])}
                    title={isAdmin && column.type !== 'files' ? '클릭하여 편집' : undefined}
                  >
                    {renderFieldValue(column)}
                  </span>
                )}
              </div>
            ))}
        </div>
      </header>

      {/* Violet Divider */}
      <hr className="mb-8 border-t-2 border-violet-400 dark:border-violet-500" />

      {/* Content Editor */}
      <div className="relative">
        {isAdmin && !isEditingContent && (
          <button
            onClick={() => setIsEditingContent(true)}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-full shadow-lg hover:bg-violet-600 transition-colors"
            title="내용 편집"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">편집</span>
          </button>
        )}

        {isEditingContent ? (
          <TipTapEditor
            content={content}
            onSave={handleSaveContent}
            onChange={setContent}
            onCancel={() => setIsEditingContent(false)}
            placeholder="내용을 입력하세요..."
          />
        ) : content ? (
          <MDXContent content={content} />
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>아직 내용이 없습니다.</p>
            {isAdmin && (
              <button
                onClick={() => setIsEditingContent(true)}
                className="mt-4 px-4 py-2 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
              >
                내용 작성하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <Link
          href={`/blog/db/${databaseSlug}`}
          className="inline-flex items-center text-violet-600 dark:text-violet-400 hover:underline"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {databaseTitle}(으)로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
