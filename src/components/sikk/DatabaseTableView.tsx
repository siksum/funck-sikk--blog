'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  categorySlugPath?: string[];
}

export default function DatabaseTableView({
  databaseId,
  databaseSlug,
  columns: initialColumns,
  items: initialItems,
  isAdmin,
  categorySlugPath,
}: DatabaseTableViewProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [items, setItems] = useState(initialItems);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Drag and drop state for columns
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Select options editing state
  const [editingSelectCell, setEditingSelectCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [newSelectOption, setNewSelectOption] = useState('');

  // File upload state
  const [uploadingCell, setUploadingCell] = useState<{ itemId: string; columnId: string } | null>(null);

  // Column width resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Sort/Filter/Group state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');

  // Hidden columns state
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnVisibilityMenu, setShowColumnVisibilityMenu] = useState(false);

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

  // Column drag and drop handlers
  const handleColumnDragStart = (columnId: string) => {
    if (!isAdmin) return;
    setDraggedColumnId(columnId);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleColumnDrop = async (targetColumnId: string) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      setDragOverColumnId(null);
      return;
    }

    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex((c) => c.id === draggedColumnId);
    const targetIndex = newColumns.findIndex((c) => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged column and insert at target position
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    setColumns(newColumns);
    setDraggedColumnId(null);
    setDragOverColumnId(null);

    // Save to backend
    try {
      await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to reorder columns:', error);
      setColumns(initialColumns); // Revert on error
    }
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };

  // Select options editing handlers
  const handleAddSelectOption = async (columnId: string) => {
    if (!newSelectOption.trim()) return;

    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    const newOptions = [...(column.options || []), newSelectOption.trim()];
    const newColumns = columns.map((c) =>
      c.id === columnId ? { ...c, options: newOptions } : c
    );

    setColumns(newColumns);
    setNewSelectOption('');

    try {
      await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to add select option:', error);
    }
  };

  const handleRemoveSelectOption = async (columnId: string, optionToRemove: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    const newOptions = (column.options || []).filter((opt) => opt !== optionToRemove);
    const newColumns = columns.map((c) =>
      c.id === columnId ? { ...c, options: newOptions } : c
    );

    setColumns(newColumns);

    try {
      await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to remove select option:', error);
    }
  };

  // File upload handlers
  const handleFileUpload = async (itemId: string, columnId: string, files: FileList) => {
    setUploadingCell({ itemId, columnId });

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

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

      // Update item data
      const updateRes = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: newFiles },
        }),
      });

      if (updateRes.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, data: { ...i.data, [columnId]: newFiles } } : i
          )
        );
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploadingCell(null);
    }
  };

  const handleRemoveFile = async (itemId: string, columnId: string, fileUrl: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const existingFiles = Array.isArray(item.data[columnId]) ? item.data[columnId] as string[] : [];
    const newFiles = existingFiles.filter((f) => f !== fileUrl);

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: newFiles },
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, data: { ...i.data, [columnId]: newFiles } } : i
          )
        );
      }
    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  };

  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnId] || 150);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(80, resizeStartWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // Processed items with sort/filter/group
  const processedItems = useMemo(() => {
    let itemsList = [...items];

    // Filter
    if (filterColumn && filterValue) {
      itemsList = itemsList.filter((item) => {
        const value = item.data[filterColumn];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    // Sort
    if (sortColumn) {
      itemsList.sort((a, b) => {
        const aVal = a.data[sortColumn];
        const bVal = b.data[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Group
    if (groupByColumn) {
      const groups: Record<string, Item[]> = {};
      itemsList.forEach((item) => {
        let groupKey = item.data[groupByColumn];

        // For date columns, extract year
        const column = columns.find((c) => c.id === groupByColumn);
        if (column?.type === 'date' && groupKey) {
          groupKey = String(groupKey).substring(0, 4); // Extract year
        }

        const key = groupKey ? String(groupKey) : '(없음)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return { items: itemsList, groups };
    }

    return { items: itemsList, groups: null };
  }, [items, columns, sortColumn, sortDirection, filterColumn, filterValue, groupByColumn]);

  // Get unique values for filter dropdown
  const getUniqueValues = (columnId: string) => {
    const values = new Set<string>();
    items.forEach((item) => {
      const val = item.data[columnId];
      if (val !== null && val !== undefined && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  };

  // Visible columns (excluding hidden ones)
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumns.has(col.id));
  }, [columns, hiddenColumns]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // Show all columns
  const showAllColumns = () => {
    setHiddenColumns(new Set());
  };

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
      const isUploading = uploadingCell?.itemId === item.id && uploadingCell?.columnId === column.id;

      return (
        <div className="flex flex-wrap gap-1 items-center">
          {files.map((file: string, i: number) => (
            <div key={i} className="relative group inline-flex items-center">
              <a
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded truncate max-w-[120px] hover:bg-gray-200 dark:hover:bg-gray-600"
                title={file}
              >
                {file.split('/').pop()}
              </a>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(item.id, column.id, file);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {isAdmin && (
            <label className="px-2 py-0.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded cursor-pointer hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors">
              {isUploading ? (
                <span className="animate-pulse">업로드 중...</span>
              ) : (
                <>
                  <span>+ 파일</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(item.id, column.id, e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </>
              )}
            </label>
          )}
          {files.length === 0 && !isAdmin && (
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
      const isEditingOptions = editingSelectCell?.itemId === item.id && editingSelectCell?.columnId === column.id;

      return (
        <div className="relative">
          <div className="flex items-center gap-1">
            {selectValue ? (
              <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                {selectValue}
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
            )}
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSelectCell(isEditingOptions ? null : { itemId: item.id, columnId: column.id });
                }}
                className="p-0.5 text-gray-400 hover:text-purple-500 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                title="옵션 편집"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Select options editor popup */}
          {isEditingOptions && isAdmin && (
            <div
              className="absolute z-50 top-full left-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                옵션 관리
              </div>
              <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                {(column.options || []).map((opt) => (
                  <div
                    key={opt}
                    className="flex items-center justify-between gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                  >
                    <span>{opt}</span>
                    <button
                      onClick={() => handleRemoveSelectOption(column.id, opt)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newSelectOption}
                  onChange={(e) => setNewSelectOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSelectOption(column.id);
                    }
                  }}
                  placeholder="새 옵션 추가"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleAddSelectOption(column.id)}
                  className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                >
                  추가
                </button>
              </div>
              <button
                onClick={() => setEditingSelectCell(null)}
                className="mt-2 w-full px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      );
    }

    if (column.type === 'title') {
      // Generate item URL based on whether we have a category path
      const itemHref = categorySlugPath
        ? `/sikk/category/${categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/db/${databaseSlug}/${item.id}`
        : `/sikk/db/${databaseSlug}/${item.id}`;

      return (
        <Link
          href={itemHref}
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
    <div>
      {/* View Options Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">정렬:</span>
          <select
            value={sortColumn || ''}
            onChange={(e) => setSortColumn(e.target.value || null)}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">없음</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
          {sortColumn && (
            <button
              onClick={() => setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {sortDirection === 'asc' ? '↑ 오름차순' : '↓ 내림차순'}
            </button>
          )}
        </div>

        {/* Group */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">그룹:</span>
          <select
            value={groupByColumn || ''}
            onChange={(e) => setGroupByColumn(e.target.value || null)}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">없음</option>
            {columns.filter((col) => col.type === 'select' || col.type === 'date').map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}{col.type === 'date' ? ' (연도별)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">필터:</span>
          <select
            value={filterColumn || ''}
            onChange={(e) => {
              setFilterColumn(e.target.value || null);
              setFilterValue('');
            }}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">없음</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
          {filterColumn && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">전체</option>
              {getUniqueValues(filterColumn).map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          )}
        </div>

        {/* Column Visibility */}
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setShowColumnVisibilityMenu(!showColumnVisibilityMenu)}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            열 표시 ({visibleColumns.length}/{columns.length})
          </button>
          {showColumnVisibilityMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[180px] p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                열 표시/숨기기
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {columns.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(col.id)}
                      onChange={() => toggleColumnVisibility(col.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{col.name}</span>
                  </label>
                ))}
              </div>
              {hiddenColumns.size > 0 && (
                <button
                  onClick={showAllColumns}
                  className="mt-2 w-full px-2 py-1 text-xs text-pink-500 hover:text-pink-700 text-center"
                >
                  모두 표시
                </button>
              )}
              <button
                onClick={() => setShowColumnVisibilityMenu(false)}
                className="mt-1 w-full px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-center"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {/* Reset */}
        {(sortColumn || groupByColumn || filterColumn || hiddenColumns.size > 0) && (
          <button
            onClick={() => {
              setSortColumn(null);
              setGroupByColumn(null);
              setFilterColumn(null);
              setFilterValue('');
              setHiddenColumns(new Set());
            }}
            className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
          >
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-200 dark:border-pink-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    draggable={isAdmin}
                    onDragStart={() => handleColumnDragStart(column.id)}
                    onDragOver={(e) => handleColumnDragOver(e, column.id)}
                    onDragLeave={handleColumnDragLeave}
                    onDrop={() => handleColumnDrop(column.id)}
                    onDragEnd={handleColumnDragEnd}
                    style={{ width: columnWidths[column.id] || 150 }}
                    className={`group relative px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-all ${
                      isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
                    } ${draggedColumnId === column.id ? 'opacity-50' : ''} ${
                      dragOverColumnId === column.id
                        ? 'bg-pink-100 dark:bg-pink-900/30 border-l-2 border-pink-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <svg
                          className="w-3 h-3 text-gray-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                        </svg>
                      )}
                      <span className="truncate">{column.name}</span>
                    </div>
                    {/* Resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-pink-500 transition-colors"
                      style={{ transform: 'translateX(50%)' }}
                    />
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
              {processedItems.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (isAdmin ? 1 : 0)}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {filterValue ? '필터 조건에 맞는 항목이 없습니다.' : '항목이 없습니다.'}
                  </td>
                </tr>
              ) : processedItems.groups ? (
                // Grouped view
                Object.entries(processedItems.groups).map(([groupName, groupItems]) => (
                  <>
                    <tr key={`group-${groupName}`} className="bg-purple-50 dark:bg-purple-900/20">
                      <td
                        colSpan={visibleColumns.length + (isAdmin ? 1 : 0)}
                        className="px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-400"
                      >
                        {groupName} ({groupItems.length})
                      </td>
                    </tr>
                    {groupItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {visibleColumns.map((column) => (
                          <td
                            key={column.id}
                            style={{ width: columnWidths[column.id] || 150 }}
                            className={`px-4 py-3 overflow-hidden ${isAdmin ? 'cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10' : ''}`}
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
                    ))}
                  </>
                ))
              ) : (
                // Regular view
                processedItems.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        style={{ width: columnWidths[column.id] || 150 }}
                        className={`px-4 py-3 overflow-hidden ${isAdmin ? 'cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10' : ''}`}
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
    </div>
  );
}
