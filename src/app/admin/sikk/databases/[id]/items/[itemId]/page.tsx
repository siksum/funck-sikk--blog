'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MDXContent from '@/components/mdx/MDXContent';

const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
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

interface DatabaseItem {
  id: string;
  data: Record<string, unknown>;
  content: string;
  order: number;
  createdAt: string;
}

interface Database {
  id: string;
  title: string;
  slug: string;
  columns: Column[];
}

export default function AdminDatabaseItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const itemId = params.itemId as string;

  const [database, setDatabase] = useState<Database | null>(null);
  const [item, setItem] = useState<DatabaseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRes = await fetch(`/api/sikk/databases/${id}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDatabase(dbData);
        }

        const itemRes = await fetch(`/api/sikk/databases/${id}/items/${itemId}`);
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          setItem(itemData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, itemId]);

  const handleSaveContent = useCallback(async (html: string) => {
    try {
      const response = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      });

      if (!response.ok) throw new Error('저장 실패');

      setItem((prev) => prev ? { ...prev, content: html } : null);
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  }, [id, itemId, router]);

  const handleUpdateField = useCallback(async (columnId: string, value: unknown) => {
    if (!item) return;

    try {
      const response = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...item.data, [columnId]: value } }),
      });

      if (!response.ok) throw new Error('저장 실패');

      setItem((prev) => prev ? { ...prev, data: { ...prev.data, [columnId]: value } } : null);
      setEditingField(null);
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
    }
  }, [id, itemId, item, router]);

  const startEditingField = (columnId: string, currentValue: unknown) => {
    setEditingField(columnId);
    setEditValue(String(currentValue || ''));
  };

  const handleFileUpload = useCallback(async (columnId: string, files: FileList) => {
    if (!item) return;
    setUploadingFile(true);

    const existingFiles = Array.isArray(item.data[columnId]) ? item.data[columnId] as string[] : [];
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
          const data = await res.json();
          uploadedUrls.push(data.url);
        }
      }

      const newFiles = [...existingFiles, ...uploadedUrls];
      await handleUpdateField(columnId, newFiles);
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  }, [item, handleUpdateField]);

  const handleRemoveFile = useCallback(async (columnId: string, fileUrl: string) => {
    if (!item) return;

    const existingFiles = Array.isArray(item.data[columnId]) ? item.data[columnId] as string[] : [];
    const newFiles = existingFiles.filter((f) => f !== fileUrl);
    await handleUpdateField(columnId, newFiles);
  }, [item, handleUpdateField]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!database || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-center text-gray-500">항목을 찾을 수 없습니다.</p>
        <Link href={`/admin/sikk/databases/${id}`} className="block text-center mt-4 text-pink-500 hover:underline">
          데이터베이스로 돌아가기
        </Link>
      </div>
    );
  }

  const columns = database.columns;
  const titleColumn = columns.find((c) => c.type === 'title');
  const title = titleColumn ? String(item.data[titleColumn.id] || '제목 없음') : '제목 없음';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center text-sm mb-4 text-gray-500 dark:text-gray-400">
          <Link href="/admin/sikk/databases" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
            데이터베이스
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/admin/sikk/databases/${id}`}
            className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
          >
            {database.title}
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
                className="flex-1 text-3xl font-bold px-2 py-1 border-2 border-pink-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateField(titleColumn.id, editValue);
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
              <button
                onClick={() => handleUpdateField(titleColumn.id, editValue)}
                className="px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
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
              className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              onClick={() => startEditingField(titleColumn.id, item.data[titleColumn.id])}
              title="클릭하여 편집"
            >
              {title}
            </h1>
          )
        )}

        {/* Metadata Fields */}
        <div className="space-y-3 text-sm">
          {columns
            .filter((c) => c.type !== 'title')
            .map((column) => (
              <div key={column.id} className="flex items-start gap-2">
                <span className="font-medium text-gray-500 dark:text-gray-400 w-28 pt-1">{column.name}:</span>

                {/* Files type - special handling */}
                {column.type === 'files' ? (
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Array.isArray(item.data[column.id]) && (item.data[column.id] as string[]).map((file, i) => (
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
                          <button
                            onClick={() => handleRemoveFile(column.id, file)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded cursor-pointer hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
                      {uploadingFile ? (
                        <span className="animate-pulse">업로드 중...</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>파일 추가</span>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
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
                  </div>
                ) : editingField === column.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    {column.type === 'select' ? (
                      <select
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          handleUpdateField(column.id, e.target.value);
                        }}
                        className="px-2 py-1 border border-pink-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        autoFocus
                      >
                        <option value="">선택...</option>
                        {(column.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : column.type === 'date' ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleUpdateField(column.id, editValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateField(column.id, editValue);
                          if (e.key === 'Escape') setEditingField(null);
                        }}
                        className="px-2 py-1 border border-pink-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <input
                        type={column.type === 'number' ? 'number' : column.type === 'url' ? 'url' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateField(column.id, editValue);
                          if (e.key === 'Escape') setEditingField(null);
                        }}
                        className="flex-1 px-2 py-1 border border-pink-400 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        autoFocus
                      />
                    )}
                    {column.type !== 'select' && (
                      <>
                        <button
                          onClick={() => handleUpdateField(column.id, editValue)}
                          className="px-2 py-1 bg-pink-500 text-white rounded text-xs hover:bg-pink-600"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span
                    className="text-gray-700 dark:text-gray-300 cursor-pointer hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    onClick={() => startEditingField(column.id, item.data[column.id])}
                    title="클릭하여 편집"
                  >
                    {column.type === 'url' && item.data[column.id] ? (
                      <a
                        href={String(item.data[column.id])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {String(item.data[column.id])}
                      </a>
                    ) : item.data[column.id] ? (
                      String(item.data[column.id])
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </span>
                )}
              </div>
            ))}
        </div>
      </header>

      {/* Pink Divider */}
      <hr className="mb-8 border-t-2 border-pink-400 dark:border-pink-500" />

      {/* Content Editor */}
      <div className="relative">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-colors"
            title="내용 편집"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">편집</span>
          </button>
        )}

        {isEditing ? (
          <TipTapEditor
            content={item.content}
            onSave={handleSaveContent}
            onChange={() => {}}
            onCancel={() => setIsEditing(false)}
            placeholder="내용을 입력하세요..."
          />
        ) : item.content ? (
          <MDXContent content={item.content} />
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p>아직 내용이 없습니다.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 px-4 py-2 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              내용 작성하기
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link
          href={`/admin/sikk/databases/${id}`}
          className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:underline"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {database.title}(으)로 돌아가기
        </Link>
      </footer>
    </div>
  );
}
