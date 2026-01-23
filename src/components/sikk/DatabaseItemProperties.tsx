'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

// Icons for each property type
function PropertyIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4 text-gray-400";

  switch (type) {
    case 'url':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    case 'date':
    case 'dateRange':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'select':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case 'number':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      );
    case 'files':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      );
    case 'text':
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
  }
}

// Format date to Korean format
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Format date range
function formatDateRange(value: DateRangeValue | null | undefined): string {
  if (!value) return '';
  const start = value.start ? formatDate(value.start) : '';
  const end = value.end ? formatDate(value.end) : '';

  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} ~`;
  if (end) return `~ ${end}`;
  return '';
}

// Get URL display text
function getUrlDisplay(url: string): { domain: string; path: string } {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname.length > 20
      ? urlObj.pathname.substring(0, 8) + '...' + urlObj.pathname.slice(-8)
      : urlObj.pathname;
    return { domain, path: path === '/' ? '' : path };
  } catch {
    return { domain: url.substring(0, 30), path: '' };
  }
}

// Get file display name
function getFileDisplayName(url: string): string {
  try {
    if (url.includes('drive.google.com')) {
      const nameMatch = url.match(/[?&]name=([^&]+)/);
      if (nameMatch) return decodeURIComponent(nameMatch[1]);
      const idMatch = url.match(/id=([^&]+)/) || url.match(/\/d\/([^/]+)/);
      if (idMatch) return `Drive (${idMatch[1].substring(0, 8)}...)`;
    }
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      return parts[parts.length - 1].replace(/^v\d+_/, '');
    }
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url.substring(0, 20) + '...';
  }
}

export default function DatabaseItemProperties({
  databaseId,
  itemId,
  columns,
  data: initialData,
  isAdmin,
}: DatabaseItemPropertiesProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter columns (exclude title)
  const displayColumns = columns.filter(c => c.type !== 'title');

  const saveField = useCallback(async (columnId: string, value: unknown) => {
    setIsSaving(true);
    const newData = { ...data, [columnId]: value };
    setData(newData);

    try {
      const response = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData }),
      });

      if (!response.ok) throw new Error('저장 실패');
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      setData(initialData);
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  }, [databaseId, itemId, data, initialData, router]);

  const handleFieldClick = useCallback((columnId: string) => {
    if (isAdmin) {
      setEditingField(columnId);
    }
  }, [isAdmin]);

  return (
    <div className="mt-4 mb-6">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {displayColumns.map((column) => (
          <PropertyRow
            key={column.id}
            column={column}
            value={data[column.id]}
            isEditing={editingField === column.id}
            isAdmin={isAdmin}
            isSaving={isSaving}
            onClick={() => handleFieldClick(column.id)}
            onSave={(value) => saveField(column.id, value)}
            onCancel={() => setEditingField(null)}
          />
        ))}
      </div>
    </div>
  );
}

interface PropertyRowProps {
  column: Column;
  value: unknown;
  isEditing: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  onClick: () => void;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

function PropertyRow({
  column,
  value,
  isEditing,
  isAdmin,
  isSaving,
  onClick,
  onSave,
  onCancel,
}: PropertyRowProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(editValue);
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancel();
    }
  };

  const renderValue = () => {
    if (isEditing) {
      return renderEditField();
    }

    const isEmpty = value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (column.type === 'dateRange' && !(value as DateRangeValue)?.start && !(value as DateRangeValue)?.end);

    if (isEmpty) {
      return (
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          비어 있음
        </span>
      );
    }

    switch (column.type) {
      case 'url':
        const urlInfo = getUrlDisplay(String(value));
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-gray-100 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-medium">{urlInfo.domain}</span>
            {urlInfo.path && <span className="text-gray-400">{urlInfo.path}</span>}
          </a>
        );

      case 'date':
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {formatDate(String(value))}
          </span>
        );

      case 'dateRange':
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {formatDateRange(value as DateRangeValue)}
          </span>
        );

      case 'select':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span>
            {String(value)}
          </span>
        );

      case 'files':
        const files = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {files.map((file: string, i: number) => (
              <a
                key={i}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {getFileDisplayName(file)}
              </a>
            ))}
          </div>
        );

      case 'number':
        return (
          <span className="text-gray-900 dark:text-gray-100 font-mono">
            {String(value)}
          </span>
        );

      case 'text':
      default:
        return (
          <span className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {String(value)}
          </span>
        );
    }
  };

  const renderEditField = () => {
    switch (column.type) {
      case 'date':
        return (
          <input
            ref={inputRef}
            type="date"
            value={String(editValue || '')}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onSave(editValue)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        );

      case 'dateRange':
        const dateRange = (editValue as DateRangeValue) || { start: '', end: '' };
        return (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="date"
              value={dateRange.start || ''}
              onChange={(e) => setEditValue({ ...dateRange, start: e.target.value })}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={dateRange.end || ''}
              onChange={(e) => setEditValue({ ...dateRange, end: e.target.value })}
              onBlur={() => onSave(editValue)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        );

      case 'url':
        return (
          <input
            ref={inputRef}
            type="url"
            value={String(editValue || '')}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onSave(editValue)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            className="w-full px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        );

      case 'select':
        return (
          <select
            value={String(editValue || '')}
            onChange={(e) => {
              setEditValue(e.target.value);
              onSave(e.target.value);
            }}
            onBlur={() => onSave(editValue)}
            className="px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
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
            ref={inputRef}
            type="number"
            value={String(editValue || '')}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onSave(editValue)}
            onKeyDown={handleKeyDown}
            className="w-32 px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        );

      case 'files':
        const files = Array.isArray(editValue) ? editValue : [];
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
                    setEditValue(newFiles);
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    const newFiles = files.filter((_: string, idx: number) => idx !== i);
                    setEditValue(newFiles);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={() => setEditValue([...files, ''])}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                + 파일 추가
              </button>
              <button
                onClick={() => onSave(editValue)}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                저장
              </button>
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={String(editValue || '')}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => onSave(editValue)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        );
    }
  };

  return (
    <div
      className={`flex items-start py-2 ${isAdmin && !isEditing ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded' : ''} ${isSaving ? 'opacity-50' : ''}`}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 pt-0.5">
        <PropertyIcon type={column.type} />
      </div>

      {/* Label */}
      <div className="flex-shrink-0 w-28 text-sm text-gray-500 dark:text-gray-400 pt-0.5">
        {column.name}
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {renderValue()}
      </div>
    </div>
  );
}
