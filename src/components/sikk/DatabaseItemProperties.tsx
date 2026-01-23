'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Column {
  id: string;
  name: string;
  type: 'date' | 'dateRange' | 'title' | 'text' | 'files' | 'url' | 'select' | 'number';
  options?: string[];
}

interface DateRangeValue {
  start: string;
  end: string;
}

interface DatabaseItemPropertiesProps {
  databaseId: string;
  itemId: string;
  columns: Column[];
  data: Record<string, unknown>;
  isAdmin: boolean;
}

// Helper function to extract domain from URL
function getUrlDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.substring(0, 30) + '...';
  }
}

// Helper function to format date range
function formatDateRange(value: DateRangeValue): string {
  if (!value.start && !value.end) return '-';
  if (value.start && value.end) {
    return `${value.start} ~ ${value.end}`;
  }
  if (value.start) {
    return `${value.start} ~`;
  }
  return `~ ${value.end}`;
}

export default function DatabaseItemProperties({
  databaseId,
  itemId,
  columns,
  data: initialData,
  isAdmin,
}: DatabaseItemPropertiesProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [databaseId, itemId, data, router]);

  const handleCancel = useCallback(() => {
    setData(initialData);
    setIsEditing(false);
  }, [initialData]);

  const updateField = useCallback((columnId: string, value: unknown) => {
    setData(prev => ({ ...prev, [columnId]: value }));
  }, []);

  // Filter columns that should be displayed (exclude title)
  const displayColumns = columns.filter(c => c.type !== 'title');

  if (!isEditing) {
    // View mode
    return (
      <div className="relative">
        {isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute -top-2 -right-2 p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="속성 편집"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          {displayColumns
            .filter(c => c.type !== 'files' && data[c.id])
            .map((column) => (
              <div key={column.id} className="flex items-center gap-1">
                <span className="font-medium">{column.name}:</span>
                <span>
                  {column.type === 'url' ? (
                    <a
                      href={String(data[column.id])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      {getUrlDomain(String(data[column.id]))}
                    </a>
                  ) : column.type === 'dateRange' ? (
                    formatDateRange(data[column.id] as DateRangeValue)
                  ) : (
                    String(data[column.id])
                  )}
                </span>
              </div>
            ))}
        </div>

        {/* Files Section */}
        {displayColumns
          .filter((c) => c.type === 'files' && Array.isArray(data[c.id]) && (data[c.id] as string[]).length > 0)
          .map((column) => (
            <div key={column.id} className="mt-4">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)', opacity: 0.7 }}>{column.name}:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(data[column.id] as string[]).map((file: string, i: number) => (
                  <a
                    key={i}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {getFileDisplayName(file)}
                  </a>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-purple-700 dark:text-purple-300">속성 편집</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {displayColumns.map((column) => (
          <div key={column.id} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {column.name}
            </label>
            {renderEditField(column, data[column.id], updateField)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get file display name
function getFileDisplayName(url: string): string {
  try {
    if (url.includes('drive.google.com')) {
      const nameMatch = url.match(/[?&]name=([^&]+)/);
      if (nameMatch) {
        return decodeURIComponent(nameMatch[1]);
      }
      const idMatch = url.match(/id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
      if (idMatch) {
        return `Drive (${idMatch[1].substring(0, 8)}...)`;
      }
    }
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.replace(/^v\d+_/, '');
    }
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url.substring(0, 20) + '...';
  }
}

// Render edit field based on column type
function renderEditField(
  column: Column,
  value: unknown,
  updateField: (columnId: string, value: unknown) => void
) {
  switch (column.type) {
    case 'date':
      return (
        <input
          type="date"
          value={String(value || '')}
          onChange={(e) => updateField(column.id, e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      );

    case 'dateRange':
      const dateRange = (value as DateRangeValue) || { start: '', end: '' };
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => updateField(column.id, { ...dateRange, start: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-gray-500">~</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => updateField(column.id, { ...dateRange, end: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      );

    case 'url':
      return (
        <input
          type="url"
          value={String(value || '')}
          onChange={(e) => updateField(column.id, e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      );

    case 'select':
      return (
        <select
          value={String(value || '')}
          onChange={(e) => updateField(column.id, e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">선택...</option>
          {column.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          type="number"
          value={String(value || '')}
          onChange={(e) => updateField(column.id, e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      );

    case 'files':
      const files = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {files.map((file: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={file}
                onChange={(e) => {
                  const newFiles = [...files];
                  newFiles[i] = e.target.value;
                  updateField(column.id, newFiles);
                }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => {
                  const newFiles = files.filter((_: string, idx: number) => idx !== i);
                  updateField(column.id, newFiles);
                }}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={() => updateField(column.id, [...files, ''])}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            + 파일 추가
          </button>
        </div>
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => updateField(column.id, e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      );
  }
}
