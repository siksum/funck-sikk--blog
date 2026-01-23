'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load Google Drive File Browser
const GoogleDriveFileBrowser = dynamic(
  () => import('@/components/common/GoogleDriveFileBrowser'),
  { ssr: false }
);

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

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  downloadUrl: string;
  thumbnailLink?: string;
  createdTime: string;
  size?: string;
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
  columns: initialColumns,
  data: initialData,
  isAdmin,
}: DatabaseItemPropertiesProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(initialColumns);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<Column['type']>('text');

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

  // Update column options (for select fields)
  const updateColumnOptions = useCallback(async (columnId: string, newOptions: string[]) => {
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, options: newOptions } : col
    );
    setColumns(updatedColumns);

    try {
      const response = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      if (!response.ok) throw new Error('옵션 저장 실패');
      router.refresh();
    } catch (error) {
      console.error('Column update error:', error);
      setColumns(initialColumns);
    }
  }, [databaseId, columns, initialColumns, router]);

  // Add new column
  const addColumn = useCallback(async () => {
    if (!newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: newColumnName.trim(),
      type: newColumnType,
      ...(newColumnType === 'select' && { options: [] }),
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    setShowAddColumn(false);
    setNewColumnName('');
    setNewColumnType('text');

    try {
      const response = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      if (!response.ok) throw new Error('열 추가 실패');
      router.refresh();
    } catch (error) {
      console.error('Add column error:', error);
      setColumns(initialColumns);
    }
  }, [databaseId, columns, initialColumns, newColumnName, newColumnType, router]);

  // Delete column
  const deleteColumn = useCallback(async (columnId: string) => {
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);

    // Also remove the data for this column
    const newData = { ...data };
    delete newData[columnId];
    setData(newData);

    try {
      // Update columns
      const colResponse = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      if (!colResponse.ok) throw new Error('열 삭제 실패');

      // Update item data
      const dataResponse = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData }),
      });

      if (!dataResponse.ok) throw new Error('데이터 삭제 실패');

      router.refresh();
    } catch (error) {
      console.error('Delete column error:', error);
      setColumns(initialColumns);
      setData(initialData);
    }
  }, [databaseId, itemId, columns, data, initialColumns, initialData, router]);

  // Toggle column type between date and dateRange
  const toggleDateRange = useCallback(async (columnId: string, currentType: 'date' | 'dateRange', currentValue: unknown) => {
    const newType = currentType === 'date' ? 'dateRange' : 'date';

    // Convert value
    let newValue: unknown;
    if (newType === 'dateRange') {
      // Convert single date to dateRange
      newValue = currentValue ? { start: String(currentValue), end: '' } : { start: '', end: '' };
    } else {
      // Convert dateRange to single date (use start date)
      const rangeValue = currentValue as DateRangeValue | null;
      newValue = rangeValue?.start || '';
    }

    // Update column type
    const updatedColumns = columns.map(col =>
      col.id === columnId ? { ...col, type: newType as Column['type'] } : col
    );
    setColumns(updatedColumns);

    // Update data
    const newData = { ...data, [columnId]: newValue };
    setData(newData);

    try {
      // Update columns
      const colResponse = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: updatedColumns }),
      });

      if (!colResponse.ok) throw new Error('타입 변경 실패');

      // Update item data
      const dataResponse = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData }),
      });

      if (!dataResponse.ok) throw new Error('데이터 변경 실패');

      router.refresh();
    } catch (error) {
      console.error('Toggle date range error:', error);
      setColumns(initialColumns);
      setData(initialData);
    }
  }, [databaseId, itemId, columns, data, initialColumns, initialData, router]);

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
            onUpdateOptions={(options) => updateColumnOptions(column.id, options)}
            onDelete={() => deleteColumn(column.id)}
            onToggleDateRange={() => toggleDateRange(column.id, column.type as 'date' | 'dateRange', data[column.id])}
            databaseId={databaseId}
          />
        ))}
      </div>

      {/* Add Column Button */}
      {isAdmin && (
        <div className="mt-4">
          {showAddColumn ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="속성 이름"
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value as Column['type'])}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="text">텍스트</option>
                  <option value="number">숫자</option>
                  <option value="date">날짜</option>
                  <option value="dateRange">기간</option>
                  <option value="url">URL</option>
                  <option value="select">선택</option>
                  <option value="files">파일</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={addColumn}
                    disabled={!newColumnName.trim()}
                    className="flex-1 px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setShowAddColumn(false);
                      setNewColumnName('');
                      setNewColumnType('text');
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              속성 추가
            </button>
          )}
        </div>
      )}
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
  onUpdateOptions: (options: string[]) => void;
  onDelete: () => void;
  onToggleDateRange: () => void;
  databaseId: string;
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
  onUpdateOptions,
  onDelete,
  onToggleDateRange,
  databaseId,
}: PropertyRowProps) {
  const [editValue, setEditValue] = useState(value);
  const [showOptionManager, setShowOptionManager] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (showOptionManager && optionInputRef.current) {
      optionInputRef.current.focus();
    }
  }, [showOptionManager]);

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const currentOptions = column.options || [];
    if (!currentOptions.includes(newOption.trim())) {
      onUpdateOptions([...currentOptions, newOption.trim()]);
    }
    setNewOption('');
  };

  const handleRemoveOption = (optionToRemove: string) => {
    const currentOptions = column.options || [];
    onUpdateOptions(currentOptions.filter(opt => opt !== optionToRemove));
  };

  const handleDriveSelect = (files: DriveFile[]) => {
    const currentFiles = Array.isArray(editValue) ? editValue : [];
    const newFileUrls = files.map(f => {
      // Use download URL with name parameter for display
      const url = new URL(f.downloadUrl);
      url.searchParams.set('name', f.name);
      return url.toString();
    });
    const updatedFiles = [...currentFiles, ...newFileUrls];
    setEditValue(updatedFiles);
    onSave(updatedFiles);
    setShowDriveBrowser(false);
  };

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
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="date"
              value={String(editValue || '')}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => onSave(editValue)}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDateRange();
              }}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap"
              title="기간으로 변경"
            >
              → 기간
            </button>
          </div>
        );

      case 'dateRange':
        const dateRange = (editValue as DateRangeValue) || { start: '', end: '' };
        return (
          <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDateRange();
              }}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap"
              title="단일 날짜로 변경"
            >
              → 날짜
            </button>
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={String(editValue || '')}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  onSave(e.target.value);
                }}
                className="px-2 py-1 text-sm border border-purple-300 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              >
                <option value="">선택...</option>
                {column.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionManager(!showOptionManager);
                }}
                className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                title="옵션 관리"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Option Manager Popup */}
            {showOptionManager && (
              <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">옵션 관리</div>

                {/* Existing options */}
                <div className="space-y-1 mb-2">
                  {(column.options || []).map((opt) => (
                    <div key={opt} className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                      <button
                        onClick={() => handleRemoveOption(opt)}
                        className="p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new option */}
                <div className="flex items-center gap-2">
                  <input
                    ref={optionInputRef}
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="새 옵션"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                    className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}
          </div>
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
                onClick={() => setShowDriveBrowser(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="currentColor">
                  <path d="M6.6 66.85l28.4-49.2 14.1 24.45-28.4 49.2z" />
                  <path d="M57.1 42.1l-14.1-24.45 28.4-49.2L85.5 66.85z" />
                  <path d="M0 78l14.1-24.45h56.8L56.8 78z" />
                </svg>
                Drive에서 가져오기
              </button>
              <button
                onClick={() => onSave(editValue)}
                className="text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                저장
              </button>
            </div>

            {/* Google Drive File Browser */}
            <GoogleDriveFileBrowser
              isOpen={showDriveBrowser}
              onClose={() => setShowDriveBrowser(false)}
              onSelect={handleDriveSelect}
              driveType="sikk"
              multiple={true}
            />
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      className={`flex items-start py-2 group ${isAdmin && !isEditing ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded' : ''} ${isSaving ? 'opacity-50' : ''}`}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 pt-0.5">
        <PropertyIcon type={column.type} />
      </div>

      {/* Label */}
      <div className="flex-shrink-0 w-28 text-sm text-gray-500 dark:text-gray-400 pt-0.5 flex items-center gap-1">
        <span>{column.name}</span>
        {isAdmin && isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="p-0.5 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="속성 삭제"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {renderValue()}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              속성 삭제
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              &apos;{column.name}&apos; 속성을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
