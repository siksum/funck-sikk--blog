'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  category: string | null;
  columns: Column[];
  items: Item[];
  isPublic: boolean;
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: DBCategory[];
}

interface DatabasePageProps {
  params: Promise<{ id: string }>;
}

export default function DatabaseDetailPage({ params }: DatabasePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [database, setDatabase] = useState<Database | null>(null);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<Column['type']>('text');

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

  // Generate flat list of all category options for dropdowns
  const categoryOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    categories.forEach((cat) => {
      options.push({ value: cat.name, label: cat.name });
      cat.children.forEach((sub) => {
        options.push({ value: `${cat.name}/${sub.name}`, label: `${cat.name} / ${sub.name}` });
      });
    });
    return options;
  }, [categories]);

  // Create a mapping from category name to slug
  const categoryNameToSlug = useMemo(() => {
    const mapping: Record<string, string> = {};
    categories.forEach((cat) => {
      mapping[cat.name] = cat.slug;
      cat.children.forEach((sub) => {
        mapping[sub.name] = sub.slug;
      });
    });
    return mapping;
  }, [categories]);

  // Generate database URL based on category (using slugs, not names)
  const getDatabaseViewUrl = () => {
    if (!database) return '/sikk';
    if (database.category) {
      const slugPath = database.category.split('/').map(name => {
        const slug = categoryNameToSlug[name];
        return encodeURIComponent(slug || name);
      }).join('/');
      return `/sikk/category/${slugPath}/${database.slug}`;
    }
    return `/sikk/db/${database.slug}`;
  };

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sikk-categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchDatabase();
    fetchCategories();
  }, [fetchDatabase, fetchCategories]);

  const handleCategoryChange = async (newCategory: string) => {
    if (!database) return;

    try {
      const res = await fetch(`/api/sikk/databases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory || null }),
      });

      if (res.ok) {
        setDatabase((prev) => prev ? { ...prev, category: newCategory || null } : null);
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

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

  // Column drag and drop handlers
  const handleColumnDragStart = (columnId: string) => {
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
    if (!database || !draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      setDragOverColumnId(null);
      return;
    }

    const newColumns = [...database.columns];
    const draggedIndex = newColumns.findIndex((c) => c.id === draggedColumnId);
    const targetIndex = newColumns.findIndex((c) => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    setDatabase((prev) => prev ? { ...prev, columns: newColumns } : null);
    setDraggedColumnId(null);
    setDragOverColumnId(null);

    try {
      await fetch(`/api/sikk/databases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to reorder columns:', error);
      fetchDatabase();
    }
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  };

  // Select options editing handlers
  const handleAddSelectOption = async (columnId: string) => {
    if (!database || !newSelectOption.trim()) return;

    const column = database.columns.find((c) => c.id === columnId);
    if (!column) return;

    const newOptions = [...(column.options || []), newSelectOption.trim()];
    const newColumns = database.columns.map((c) =>
      c.id === columnId ? { ...c, options: newOptions } : c
    );

    setDatabase((prev) => prev ? { ...prev, columns: newColumns } : null);
    setNewSelectOption('');

    try {
      await fetch(`/api/sikk/databases/${id}`, {
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
    if (!database) return;

    const column = database.columns.find((c) => c.id === columnId);
    if (!column) return;

    const newOptions = (column.options || []).filter((opt) => opt !== optionToRemove);
    const newColumns = database.columns.map((c) =>
      c.id === columnId ? { ...c, options: newOptions } : c
    );

    setDatabase((prev) => prev ? { ...prev, columns: newColumns } : null);

    try {
      await fetch(`/api/sikk/databases/${id}`, {
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
    if (!database) return;
    setUploadingCell({ itemId, columnId });

    const item = database.items.find((i) => i.id === itemId);
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

      const updateRes = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: newFiles },
        }),
      });

      if (updateRes.ok) {
        setDatabase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, data: { ...i.data, [columnId]: newFiles } } : i
            ),
          };
        });
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setUploadingCell(null);
    }
  };

  const handleRemoveFile = async (itemId: string, columnId: string, fileUrl: string) => {
    if (!database) return;

    const item = database.items.find((i) => i.id === itemId);
    if (!item) return;

    const existingFiles = Array.isArray(item.data[columnId]) ? item.data[columnId] as string[] : [];
    const newFiles = existingFiles.filter((f) => f !== fileUrl);

    try {
      const res = await fetch(`/api/sikk/databases/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { ...item.data, [columnId]: newFiles },
        }),
      });

      if (res.ok) {
        setDatabase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, data: { ...i.data, [columnId]: newFiles } } : i
            ),
          };
        });
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
    if (!database) return { items: [], groups: null };

    let items = [...database.items];

    // Filter
    if (filterColumn && filterValue) {
      items = items.filter((item) => {
        const value = item.data[filterColumn];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    // Sort
    if (sortColumn) {
      items.sort((a, b) => {
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
      items.forEach((item) => {
        let groupKey = item.data[groupByColumn];

        // For date columns, extract year
        const column = database.columns.find((c) => c.id === groupByColumn);
        if (column?.type === 'date' && groupKey) {
          groupKey = String(groupKey).substring(0, 4); // Extract year
        }

        const key = groupKey ? String(groupKey) : '(없음)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return { items, groups };
    }

    return { items, groups: null };
  }, [database, sortColumn, sortDirection, filterColumn, filterValue, groupByColumn]);

  // Get unique values for filter dropdown
  const getUniqueValues = (columnId: string) => {
    if (!database) return [];
    const values = new Set<string>();
    database.items.forEach((item) => {
      const val = item.data[columnId];
      if (val !== null && val !== undefined && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  };

  // Visible columns (excluding hidden ones)
  const visibleColumns = useMemo(() => {
    if (!database) return [];
    return database.columns.filter((col) => !hiddenColumns.has(col.id));
  }, [database, hiddenColumns]);

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
      const isUploading = uploadingCell?.itemId === item.id && uploadingCell?.columnId === column.id;

      return (
        <div className="flex flex-wrap gap-1 items-center" onClick={(e) => e.stopPropagation()}>
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(item.id, column.id, file);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
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
          </div>

          {isEditingOptions && (
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
          {/* Category selector */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">카테고리:</span>
            <select
              value={database.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">없음</option>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowColumnModal(true)}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            + 열 추가
          </button>
          <Link
            href={getDatabaseViewUrl()}
            className="px-3 py-1.5 text-sm text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
          >
            페이지 보기
          </Link>
        </div>
      </div>

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
            {database.columns.map((col) => (
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
            {database.columns.filter((col) => col.type === 'select' || col.type === 'date').map((col) => (
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
            {database.columns.map((col) => (
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
            열 표시 ({visibleColumns.length}/{database.columns.length})
          </button>
          {showColumnVisibilityMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[180px] p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                열 표시/숨기기
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {database.columns.map((col) => (
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

      {/* Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    draggable
                    onDragStart={() => handleColumnDragStart(column.id)}
                    onDragOver={(e) => handleColumnDragOver(e, column.id)}
                    onDragLeave={handleColumnDragLeave}
                    onDrop={() => handleColumnDrop(column.id)}
                    onDragEnd={handleColumnDragEnd}
                    style={{ width: columnWidths[column.id] || 150 }}
                    className={`group relative px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-grab active:cursor-grabbing transition-all ${
                      draggedColumnId === column.id ? 'opacity-50' : ''
                    } ${
                      dragOverColumnId === column.id
                        ? 'bg-pink-100 dark:bg-pink-900/30 border-l-2 border-pink-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3 h-3 text-gray-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                      <span className="truncate">{column.name}</span>
                      <button
                        onClick={() => handleDeleteColumn(column.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                        title="열 삭제"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize group/resize z-10"
                      style={{ transform: 'translateX(50%)' }}
                    >
                      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-300 dark:bg-gray-600 group-hover/resize:bg-pink-500 group-hover/resize:w-1 transition-all" />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedItems.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
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
                        colSpan={visibleColumns.length + 1}
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
                            className="px-4 py-3 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10 overflow-hidden"
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
                        className="px-4 py-3 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10 overflow-hidden"
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
