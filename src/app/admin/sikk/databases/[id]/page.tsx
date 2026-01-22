'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';

interface Column {
  id: string;
  name: string;
  type: 'date' | 'title' | 'text' | 'files' | 'url' | 'select' | 'number';
  options?: string[];
}

interface Item {
  id: string;
  data: Record<string, unknown>;
  content: string;
  order: number;
  createdAt: string;
}

interface Database {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  columns: Column[];
  items: Item[];
  isPublic: boolean;
}

interface DatabasePageProps {
  params: Promise<{ id: string }>;
}

export default function DatabaseDetailPage({ params }: DatabasePageProps) {
  const { id } = use(params);
  const [database, setDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<Column['type']>('text');

  const fetchDatabase = useCallback(async () => {
    try {
      const res = await fetch(`/api/sikk/databases/${id}`);
      const data = await res.json();
      if (data && !data.error) {
        setDatabase(data);
      }
    } catch (error) {
      console.error('Failed to fetch database:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDatabase();
  }, [fetchDatabase]);

  const handleAddItem = async () => {
    if (!database) return;

    try {
      // Create default data for new item
      const defaultData: Record<string, unknown> = {};
      database.columns.forEach((col) => {
        if (col.type === 'date') {
          defaultData[col.id] = new Date().toISOString().split('T')[0];
        } else if (col.type === 'title') {
          defaultData[col.id] = '새 항목';
        } else {
          defaultData[col.id] = '';
        }
      });

      const res = await fetch(`/api/sikk/databases/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: defaultData }),
      });

      if (res.ok) {
        fetchDatabase();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleUpdateCell = async (itemId: string, columnId: string, value: unknown) => {
    if (!database) return;

    const item = database.items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const res = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: value },
        }),
      });

      if (res.ok) {
        setDatabase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, data: { ...i.data, [columnId]: value } } : i
            ),
          };
        });
      }
    } catch (error) {
      console.error('Failed to update cell:', error);
    }

    setEditingCell(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchDatabase();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleAddColumn = async () => {
    if (!database || !newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: newColumnName.trim(),
      type: newColumnType,
      ...(newColumnType === 'select' && { options: [] }),
    };

    try {
      const res = await fetch(`/api/sikk/databases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: [...database.columns, newColumn],
        }),
      });

      if (res.ok) {
        setNewColumnName('');
        setNewColumnType('text');
        setShowColumnModal(false);
        fetchDatabase();
      }
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!database) return;
    if (!confirm('이 열을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/sikk/databases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: database.columns.filter((c) => c.id !== columnId),
        }),
      });

      if (res.ok) {
        fetchDatabase();
      }
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const startEditing = (itemId: string, columnId: string, currentValue: unknown) => {
    setEditingCell({ itemId, columnId });
    setEditValue(String(currentValue || ''));
  };

  const renderCell = (item: Item, column: Column) => {
    const value = item.data[column.id];
    const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id;

    if (isEditing) {
      if (column.type === 'date') {
        return (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleUpdateCell(item.id, column.id, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateCell(item.id, column.id, editValue);
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full px-2 py-1 text-sm border border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            autoFocus
          />
        );
      }

      if (column.type === 'select' && column.options) {
        return (
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              handleUpdateCell(item.id, column.id, e.target.value);
            }}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            autoFocus
          >
            <option value="">선택...</option>
            {column.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={column.type === 'number' ? 'number' : column.type === 'url' ? 'url' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleUpdateCell(item.id, column.id, editValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdateCell(item.id, column.id, editValue);
            if (e.key === 'Escape') setEditingCell(null);
          }}
          className="w-full px-2 py-1 text-sm border border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          autoFocus
        />
      );
    }

    // Display value
    if (column.type === 'files') {
      const files = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {files.length > 0 ? (
            files.map((file: string, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[120px]"
                title={file}
              >
                {file.split('/').pop()}
              </span>
            ))
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
          )}
        </div>
      );
    }

    if (column.type === 'url') {
      const url = String(value || '');
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 dark:text-pink-400 hover:underline text-sm truncate block max-w-[200px]"
          title={url}
        >
          {url}
        </a>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
      );
    }

    if (column.type === 'select') {
      const selectValue = String(value || '');
      return selectValue ? (
        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
          {selectValue}
        </span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
      );
    }

    if (column.type === 'title') {
      return (
        <Link
          href={`/admin/sikk/databases/${id}/items/${item.id}`}
          className="text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 font-medium"
        >
          {String(value || '제목 없음')}
        </Link>
      );
    }

    return (
      <span className="text-sm text-gray-900 dark:text-white">
        {value ? String(value) : <span className="text-gray-400 dark:text-gray-500">-</span>}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">데이터베이스를 찾을 수 없습니다.</p>
        <Link href="/admin/sikk/databases" className="text-pink-600 hover:underline mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/sikk/databases"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← 데이터베이스
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {database.title}
          </h1>
          {database.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{database.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowColumnModal(true)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            + 열 추가
          </button>
          <Link
            href={`/sikk/db/${database.slug}`}
            className="px-3 py-1.5 text-sm text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
          >
            페이지 보기
          </Link>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {database.columns.map((column) => (
                  <th
                    key={column.id}
                    className="group px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.name}</span>
                      <button
                        onClick={() => handleDeleteColumn(column.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity"
                        title="열 삭제"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {database.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={database.columns.length + 1}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    항목이 없습니다.
                  </td>
                </tr>
              ) : (
                database.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {database.columns.map((column) => (
                      <td
                        key={column.id}
                        className="px-4 py-3 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10"
                        onClick={() => startEditing(item.id, column.id, item.data[column.id])}
                      >
                        {renderCell(item, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Item Button */}
        <button
          onClick={handleAddItem}
          className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 페이지
        </button>
      </div>

      {/* Add Column Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              새 열 추가
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  열 이름
                </label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="열 이름"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  열 타입
                </label>
                <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value as Column['type'])}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="text">텍스트</option>
                  <option value="title">제목 (링크)</option>
                  <option value="date">날짜</option>
                  <option value="number">숫자</option>
                  <option value="url">URL</option>
                  <option value="files">파일</option>
                  <option value="select">선택</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="px-4 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
