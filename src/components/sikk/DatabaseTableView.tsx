'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  createdAt: Date;
}

interface DatabaseTableViewProps {
  databaseId: string;
  databaseSlug: string;
  columns: Column[];
  items: Item[];
  isAdmin: boolean;
}

export default function DatabaseTableView({
  databaseId,
  databaseSlug,
  columns,
  items: initialItems,
  isAdmin,
}: DatabaseTableViewProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleAddItem = useCallback(async () => {
    // Create default data for new item
    const defaultData: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col.type === 'date') {
        defaultData[col.id] = new Date().toISOString().split('T')[0];
      } else if (col.type === 'title') {
        defaultData[col.id] = '새 항목';
      } else {
        defaultData[col.id] = '';
      }
    });

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: defaultData }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setItems((prev) => [...prev, newItem]);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  }, [databaseId, columns, router]);

  const handleUpdateCell = useCallback(async (itemId: string, columnId: string, value: unknown) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: value },
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, data: { ...i.data, [columnId]: value } } : i
          )
        );
      }
    } catch (error) {
      console.error('Failed to update cell:', error);
    }

    setEditingCell(null);
  }, [databaseId, items]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }, [databaseId, router]);

  const startEditing = (itemId: string, columnId: string, currentValue: unknown) => {
    if (!isAdmin) return;
    setEditingCell({ itemId, columnId });
    setEditValue(String(currentValue || ''));
  };

  const renderCell = (item: Item, column: Column) => {
    const value = item.data[column.id];
    const isEditing = editingCell?.itemId === item.id && editingCell?.columnId === column.id;

    if (isEditing && isAdmin) {
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
              <a
                key={i}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[120px] hover:bg-gray-200 dark:hover:bg-gray-600"
                title={file}
              >
                {file.split('/').pop()}
              </a>
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
          href={`/sikk/db/${databaseSlug}/${item.id}`}
          className="text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-200 dark:border-pink-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {column.name}
                </th>
              ))}
              {isAdmin && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                  ...
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isAdmin ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  항목이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 ${isAdmin ? 'cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10' : ''}`}
                      onClick={() => startEditing(item.id, column.id, item.data[column.id])}
                    >
                      {renderCell(item, column)}
                    </td>
                  ))}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Button (Admin Only) */}
      {isAdmin && (
        <button
          onClick={handleAddItem}
          className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 페이지
        </button>
      )}
    </div>
  );
}
