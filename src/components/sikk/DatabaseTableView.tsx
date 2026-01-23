'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { uploadToGoogleDriveDirect } from '@/lib/google-drive-client';

// Helper function to extract proper filename from various URL types
function getFileDisplayName(url: string): string {
  try {
    // Google Drive URL: https://drive.google.com/uc?id=xxx&export=download
    if (url.includes('drive.google.com/uc?id=')) {
      const match = url.match(/id=([^&]+)/);
      if (match) {
        return `📄 Drive (${match[1].substring(0, 8)}...)`;
      }
    }
    // Google Drive view URL: https://drive.google.com/file/d/xxx/view
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([^/]+)/);
      if (match) {
        return `📄 Drive (${match[1].substring(0, 8)}...)`;
      }
    }
    // Cloudinary URL: https://res.cloudinary.com/.../filename.ext
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return filename.replace(/^v\d+_/, '');
    }
    // Default: just get the last part of the path
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  } catch {
    return url.substring(0, 20) + '...';
  }
}

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
  const searchParams = useSearchParams();
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

  // localStorage key for this database's view state
  const storageKey = `db-view-${databaseId}`;

  // Helper to get initial state from URL or localStorage
  const getInitialState = useCallback(<T,>(urlParam: string, urlValue: string | null, defaultValue: T, parser?: (val: string) => T): T => {
    // URL params take priority
    if (urlValue !== null && urlValue !== '') {
      return parser ? parser(urlValue) : (urlValue as unknown as T);
    }
    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed[urlParam] !== undefined) {
            return parser ? parser(parsed[urlParam]) : parsed[urlParam];
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return defaultValue;
  }, [storageKey]);

  // Sort/Filter/Group state - initialize from URL params or localStorage
  const [sortColumn, setSortColumn] = useState<string | null>(() =>
    getInitialState('sort', searchParams.get('sort'), null)
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() =>
    getInitialState('dir', searchParams.get('dir'), 'asc') as 'asc' | 'desc'
  );
  const [groupByColumn, setGroupByColumn] = useState<string | null>(() =>
    getInitialState('group', searchParams.get('group'), null)
  );
  const [filterColumn, setFilterColumn] = useState<string | null>(() =>
    getInitialState('filterCol', searchParams.get('filterCol'), null)
  );
  const [filterValue, setFilterValue] = useState<string>(() =>
    getInitialState('filterVal', searchParams.get('filterVal'), '')
  );

  // Hidden columns state - initialize from URL params or localStorage
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    const urlHidden = searchParams.get('hidden');
    if (urlHidden) {
      return new Set(urlHidden.split(','));
    }
    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.hidden) {
            return new Set(parsed.hidden.split(','));
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return new Set();
  });

  // Track previous URL to detect actual navigation
  const prevUrlRef = useRef<string>('');

  // Save view state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stateToSave: Record<string, string | null> = {
      sort: sortColumn,
      dir: sortDirection,
      group: groupByColumn,
      filterCol: filterColumn,
      filterVal: filterValue || null,
      hidden: hiddenColumns.size > 0 ? Array.from(hiddenColumns).join(',') : null,
    };

    // Remove null values before saving
    const cleanState = Object.fromEntries(
      Object.entries(stateToSave).filter(([, v]) => v !== null)
    );

    try {
      localStorage.setItem(storageKey, JSON.stringify(cleanState));
    } catch {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  }, [sortColumn, sortDirection, groupByColumn, filterColumn, filterValue, hiddenColumns, storageKey]);

  // Sync state with URL params on navigation (only when URL actually changes from external navigation)
  useEffect(() => {
    const currentUrl = searchParams.toString();

    // Skip if this is the same URL (prevents resetting on state updates)
    if (prevUrlRef.current === currentUrl) return;
    prevUrlRef.current = currentUrl;

    // Only sync non-empty values from URL (don't reset to defaults on hydration)
    const sort = searchParams.get('sort');
    const dir = searchParams.get('dir') as 'asc' | 'desc' | null;
    const group = searchParams.get('group');
    const filterCol = searchParams.get('filterCol');
    const filterVal = searchParams.get('filterVal');
    const hidden = searchParams.get('hidden');

    if (sort !== null) setSortColumn(sort);
    if (dir !== null) setSortDirection(dir);
    if (group !== null) setGroupByColumn(group);
    if (filterCol !== null) setFilterColumn(filterCol);
    if (filterVal !== null) setFilterValue(filterVal);
    if (hidden !== null) setHiddenColumns(new Set(hidden.split(',')));
  }, [searchParams]);

  // Update URL when state changes
  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);
  const [showColumnVisibilityMenu, setShowColumnVisibilityMenu] = useState(false);

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false);
  const [showBulkDateMenu, setShowBulkDateMenu] = useState(false);
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Add column state
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<Column['type']>('text');

  const handleAddItem = useCallback(async () => {
    // Create default data for new item
    const defaultData: Record<string, unknown> = {};
    const today = new Date().toISOString().split('T')[0];
    columns.forEach((col) => {
      if (col.type === 'date') {
        defaultData[col.id] = today;
      } else if (col.type === 'dateRange') {
        defaultData[col.id] = { start: today, end: '' };
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

  // Bulk selection handlers
  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setShowBulkCategoryMenu(false);
    setShowBulkDateMenu(false);
  }, []);

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`${selectedItems.size}개의 항목을 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = Array.from(selectedItems).map((itemId) =>
        fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);
      setItems((prev) => prev.filter((i) => !selectedItems.has(i.id)));
      setSelectedItems(new Set());
      router.refresh();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
    }
  }, [databaseId, selectedItems, router]);

  // Bulk category change
  const handleBulkCategoryChange = useCallback(async (category: string) => {
    if (selectedItems.size === 0) return;

    const selectColumn = columns.find((c) => c.type === 'select');
    if (!selectColumn) return;

    try {
      const updatePromises = Array.from(selectedItems).map((itemId) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return Promise.resolve();

        return fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...item.data, [selectColumn.id]: category },
          }),
        });
      });

      await Promise.all(updatePromises);
      setItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.id)
            ? { ...item, data: { ...item.data, [selectColumn.id]: category } }
            : item
        )
      );
      setShowBulkCategoryMenu(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to bulk update category:', error);
    }
  }, [databaseId, columns, items, selectedItems, router]);

  // Bulk date change
  const handleBulkDateChange = useCallback(async () => {
    if (selectedItems.size === 0 || !bulkDate) return;

    const dateColumn = columns.find((c) => c.type === 'date');
    if (!dateColumn) return;

    try {
      const updatePromises = Array.from(selectedItems).map((itemId) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return Promise.resolve();

        return fetch(`/api/sikk/databases/${databaseId}/items/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { ...item.data, [dateColumn.id]: bulkDate },
          }),
        });
      });

      await Promise.all(updatePromises);
      setItems((prev) =>
        prev.map((item) =>
          selectedItems.has(item.id)
            ? { ...item, data: { ...item.data, [dateColumn.id]: bulkDate } }
            : item
        )
      );
      setShowBulkDateMenu(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to bulk update date:', error);
    }
  }, [databaseId, columns, items, selectedItems, bulkDate, router]);

  // Add column handler
  const handleAddColumn = useCallback(async () => {
    if (!newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col_${Date.now()}`,
      name: newColumnName.trim(),
      type: newColumnType,
      ...(newColumnType === 'select' && { options: [] }),
    };

    const newColumns = [...columns, newColumn];

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });

      if (res.ok) {
        setColumns(newColumns);
        setNewColumnName('');
        setNewColumnType('text');
        setShowColumnModal(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  }, [databaseId, columns, newColumnName, newColumnType, router]);

  // Delete column handler
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    if (!confirm('이 열을 삭제하시겠습니까?')) return;

    const newColumns = columns.filter((c) => c.id !== columnId);

    try {
      const res = await fetch(`/api/sikk/databases/${databaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newColumns }),
      });

      if (res.ok) {
        setColumns(newColumns);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  }, [databaseId, columns, router]);

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
        const isImage = file.type.startsWith('image/');

        if (isImage) {
          // Images → Cloudinary
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            uploadedUrls.push(data.url);
          } else {
            throw new Error('Cloudinary upload failed');
          }
        } else {
          // Non-images (PDF, docs, etc.) → Google Drive only
          const category = categorySlugPath?.length ? categorySlugPath[categorySlugPath.length - 1] : '';
          const result = await uploadToGoogleDriveDirect(file, { driveType: 'sikk', category });
          uploadedUrls.push(result.url);
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
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
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
    setResizeStartWidth(columnWidths[columnId] || 200);
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
      const sortColumnDef = columns.find((c) => c.id === sortColumn);
      itemsList.sort((a, b) => {
        let aVal = a.data[sortColumn];
        let bVal = b.data[sortColumn];

        // For dateRange, use start date for sorting
        if (sortColumnDef?.type === 'dateRange') {
          aVal = (aVal as DateRangeValue)?.start || '';
          bVal = (bVal as DateRangeValue)?.start || '';
        }

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined || aVal === '') return 1;
        if (bVal === null || bVal === undefined || bVal === '') return -1;

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
        } else if (column?.type === 'dateRange' && groupKey) {
          // For dateRange, use start date's year
          const dateRange = groupKey as DateRangeValue;
          groupKey = dateRange.start ? dateRange.start.substring(0, 4) : null;
        }

        const key = groupKey ? String(groupKey) : '(없음)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
      return { items: itemsList, groups };
    }

    return { items: itemsList, groups: null };
  }, [items, columns, sortColumn, sortDirection, filterColumn, filterValue, groupByColumn]);

  // Toggle select all (depends on processedItems)
  const toggleSelectAll = useCallback(() => {
    const currentItems = processedItems.items;
    const allSelected = currentItems.every((item) => selectedItems.has(item.id));
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(currentItems.map((item) => item.id)));
    }
  }, [processedItems.items, selectedItems]);

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
      // Update URL
      const hiddenStr = Array.from(next).join(',');
      updateUrlParams({ hidden: hiddenStr || null });
      return next;
    });
  };

  // Show all columns
  const showAllColumns = () => {
    setHiddenColumns(new Set());
    updateUrlParams({ hidden: null });
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

      if (column.type === 'dateRange') {
        const dateRange = (value as DateRangeValue) || { start: '', end: '' };
        return (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateRange.start || ''}
              onChange={(e) => {
                const newRange = { ...dateRange, start: e.target.value };
                handleUpdateCell(item.id, column.id, newRange);
              }}
              className="w-[130px] px-2 py-1 text-sm border border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              autoFocus
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={dateRange.end || ''}
              onChange={(e) => {
                const newRange = { ...dateRange, end: e.target.value };
                handleUpdateCell(item.id, column.id, newRange);
              }}
              onBlur={() => setEditingCell(null)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-[130px] px-2 py-1 text-sm border border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        );
      }

      if (column.type === 'select') {
        const options = column.options || [];
        return (
          <select
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              handleUpdateCell(item.id, column.id, e.target.value);
            }}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border-2 border-pink-400 rounded focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
            autoFocus
            style={{ position: 'relative', zIndex: 10 }}
          >
            <option value="">선택...</option>
            {options.map((opt) => (
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
                {getFileDisplayName(file)}
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

    if (column.type === 'dateRange') {
      const dateRange = (value as DateRangeValue) || { start: '', end: '' };
      const startDate = dateRange.start || '';
      const endDate = dateRange.end || '';

      if (!startDate && !endDate) {
        return <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>;
      }

      return (
        <span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
          {startDate || '?'} ~ {endDate || '진행중'}
        </span>
      );
    }

    if (column.type === 'title') {
      // New URL format: /sikk/categories/[...categoryPath]/db/[slug]/[itemId]
      const itemHref = categorySlugPath && categorySlugPath.length > 0
        ? `/sikk/categories/${categorySlugPath.map(s => encodeURIComponent(s)).join('/')}/db/${encodeURIComponent(databaseSlug)}/${item.id}`
        : `/sikk/categories/uncategorized/db/${encodeURIComponent(databaseSlug)}/${item.id}`;

      return (
        <div className="relative group">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium pr-6">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{String(value || '제목 없음')}</span>
          </div>
          <Link
            href={itemHref}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 bottom-0 p-1 text-gray-400 hover:text-pink-500 transition-colors"
            title="상세 페이지로 이동"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
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
            onChange={(e) => {
              const value = e.target.value || null;
              setSortColumn(value);
              updateUrlParams({ sort: value });
            }}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">없음</option>
            {columns.map((col) => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
          {sortColumn && (
            <button
              onClick={() => {
                const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
                setSortDirection(newDir);
                updateUrlParams({ dir: newDir });
              }}
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
            onChange={(e) => {
              const value = e.target.value || null;
              setGroupByColumn(value);
              updateUrlParams({ group: value });
            }}
            className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="">없음</option>
            {columns.filter((col) => col.type === 'select' || col.type === 'date' || col.type === 'dateRange').map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}{(col.type === 'date' || col.type === 'dateRange') ? ' (연도별)' : ''}
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
              const value = e.target.value || null;
              setFilterColumn(value);
              setFilterValue('');
              updateUrlParams({ filterCol: value, filterVal: null });
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
              onChange={(e) => {
                const value = e.target.value;
                setFilterValue(value);
                updateUrlParams({ filterVal: value || null });
              }}
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

        {/* Add Column Button (Admin) */}
        {isAdmin && (
          <button
            onClick={() => setShowColumnModal(true)}
            className="px-2 py-1 text-xs border border-pink-200 dark:border-pink-700 rounded bg-white dark:bg-gray-900 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            열 추가
          </button>
        )}

        {/* Reset */}
        {(sortColumn || groupByColumn || filterColumn || hiddenColumns.size > 0) && (
          <button
            onClick={() => {
              setSortColumn(null);
              setGroupByColumn(null);
              setFilterColumn(null);
              setFilterValue('');
              setHiddenColumns(new Set());
              // Clear all URL params
              updateUrlParams({
                sort: null,
                dir: null,
                group: null,
                filterCol: null,
                filterVal: null,
                hidden: null,
              });
            }}
            className="px-2 py-1 text-xs text-red-500 hover:text-red-700"
          >
            초기화
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isAdmin && selectedItems.size > 0 && (
        <div className="mb-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800/50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-pink-700 dark:text-pink-400">
              {selectedItems.size}개 선택됨
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              선택 해제
            </button>
          </div>

          <div className="h-4 w-px bg-pink-200 dark:bg-pink-800" />

          {/* Bulk Delete */}
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            삭제
          </button>

          {/* Bulk Category Change */}
          {columns.some((c) => c.type === 'select') && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowBulkCategoryMenu(!showBulkCategoryMenu);
                  setShowBulkDateMenu(false);
                }}
                className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                카테고리 변경
              </button>
              {showBulkCategoryMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[150px] py-1">
                  {columns.find((c) => c.type === 'select')?.options?.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleBulkCategoryChange(opt)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300"
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    onClick={() => handleBulkCategoryChange('')}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700"
                  >
                    (없음)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Date Change */}
          {columns.some((c) => c.type === 'date') && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowBulkDateMenu(!showBulkDateMenu);
                  setShowBulkCategoryMenu(false);
                }}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                날짜 변경
              </button>
              {showBulkDateMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleBulkDateChange}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    적용
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-200 dark:border-pink-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Checkbox column */}
                {isAdmin && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={processedItems.items.length > 0 && processedItems.items.every((item) => selectedItems.has(item.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-pink-500 focus:ring-pink-500"
                    />
                  </th>
                )}
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    draggable={isAdmin}
                    onDragStart={() => handleColumnDragStart(column.id)}
                    onDragOver={(e) => handleColumnDragOver(e, column.id)}
                    onDragLeave={handleColumnDragLeave}
                    onDrop={() => handleColumnDrop(column.id)}
                    onDragEnd={handleColumnDragEnd}
                    style={{ width: columnWidths[column.id] || 200 }}
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
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColumn(column.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                          title="열 삭제"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
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
                    colSpan={visibleColumns.length + (isAdmin ? 2 : 0)}
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
                        colSpan={visibleColumns.length + (isAdmin ? 2 : 0)}
                        className="px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-400"
                      >
                        {groupName} ({groupItems.length})
                      </td>
                    </tr>
                    {groupItems.map((item) => (
                      <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedItems.has(item.id) ? 'bg-pink-50 dark:bg-pink-900/10' : ''}`}>
                        {/* Checkbox */}
                        {isAdmin && (
                          <td className="w-10 px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleSelectItem(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 dark:border-gray-600 text-pink-500 focus:ring-pink-500"
                            />
                          </td>
                        )}
                        {visibleColumns.map((column) => (
                          <td
                            key={column.id}
                            style={{ width: columnWidths[column.id] || 200 }}
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
                    ))}
                  </>
                ))
              ) : (
                // Regular view
                processedItems.items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedItems.has(item.id) ? 'bg-pink-50 dark:bg-pink-900/10' : ''}`}>
                    {/* Checkbox */}
                    {isAdmin && (
                      <td className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-gray-600 text-pink-500 focus:ring-pink-500"
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => (
                      <td
                        key={column.id}
                        style={{ width: columnWidths[column.id] || 200 }}
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
                onClick={() => {
                  setShowColumnModal(false);
                  setNewColumnName('');
                  setNewColumnType('text');
                }}
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
