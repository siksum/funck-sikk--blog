'use client';

import { useState } from 'react';

interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'url';
  options?: string[]; // for select type
}

interface Row {
  id: string;
  data: Record<string, string | number | boolean>;
}

interface DatabaseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const columnTypes = [
  { value: 'text', label: '텍스트' },
  { value: 'number', label: '숫자' },
  { value: 'date', label: '날짜' },
  { value: 'select', label: '선택' },
  { value: 'checkbox', label: '체크박스' },
  { value: 'url', label: 'URL' },
];

export default function DatabaseEditor({ isOpen, onClose, onInsert }: DatabaseEditorProps) {
  const [dbName, setDbName] = useState('데이터베이스');
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', name: '이름', type: 'text' },
    { id: '2', name: '상태', type: 'select', options: ['진행중', '완료', '대기'] },
    { id: '3', name: '날짜', type: 'date' },
  ]);
  const [rows, setRows] = useState<Row[]>([
    { id: '1', data: { '1': '', '2': '', '3': '' } },
  ]);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  const addColumn = () => {
    const newId = String(Date.now());
    setColumns([...columns, { id: newId, name: `열 ${columns.length + 1}`, type: 'text' }]);
    setRows(rows.map((row) => ({ ...row, data: { ...row.data, [newId]: '' } })));
  };

  const removeColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId));
    setRows(rows.map((row) => {
      const newData = { ...row.data };
      delete newData[columnId];
      return { ...row, data: newData };
    }));
  };

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, ...updates } : col)));
  };

  const addRow = () => {
    const newId = String(Date.now());
    const emptyData: Record<string, string> = {};
    columns.forEach((col) => {
      emptyData[col.id] = '';
    });
    setRows([...rows, { id: newId, data: emptyData }]);
  };

  const removeRow = (rowId: string) => {
    setRows(rows.filter((row) => row.id !== rowId));
  };

  const updateCell = (rowId: string, columnId: string, value: string | number | boolean) => {
    setRows(rows.map((row) =>
      row.id === rowId ? { ...row, data: { ...row.data, [columnId]: value } } : row
    ));
  };

  const generateMarkdown = () => {
    const headerRow = `| ${columns.map((col) => col.name).join(' | ')} |`;
    const separatorRow = `| ${columns.map(() => '---').join(' | ')} |`;
    const dataRows = rows
      .map((row) => {
        const cells = columns.map((col) => {
          const value = row.data[col.id];
          if (col.type === 'checkbox') {
            return value ? '✅' : '⬜';
          }
          if (col.type === 'url' && value) {
            return `[링크](${value})`;
          }
          return String(value || ' ');
        });
        return `| ${cells.join(' | ')} |`;
      })
      .join('\n');

    return `### ${dbName}\n\n${headerRow}\n${separatorRow}\n${dataRows}`;
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsert('\n' + markdown + '\n');
    onClose();
  };

  const renderCellInput = (row: Row, column: Column) => {
    const value = row.data[column.id];

    switch (column.type) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateCell(row.id, column.id, e.target.checked)}
            className="w-5 h-5"
          />
        );
      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">선택...</option>
            {column.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={String(value || '')}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={String(value || '')}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );
      case 'url':
        return (
          <input
            type="url"
            value={String(value || '')}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            placeholder="https://..."
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );
      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 text-sm"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              className="text-xl font-semibold bg-transparent text-gray-900 dark:text-white border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0 min-w-[150px]"
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {columnTypes.find((t) => t.value === column.type)?.label}
                        </span>
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                          className="font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingColumn(editingColumn === column.id ? null : column.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        {columns.length > 1 && (
                          <button
                            onClick={() => removeColumn(column.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Column settings dropdown */}
                    {editingColumn === column.id && (
                      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                        <label className="block text-xs text-gray-500 mb-1">타입</label>
                        <select
                          value={column.type}
                          onChange={(e) => updateColumn(column.id, { type: e.target.value as Column['type'] })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {columnTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        {column.type === 'select' && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-500 mb-1">옵션 (쉼표로 구분)</label>
                            <input
                              type="text"
                              value={column.options?.join(', ') || ''}
                              onChange={(e) => updateColumn(column.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="옵션1, 옵션2, 옵션3"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 w-10">
                  <button
                    onClick={addColumn}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="열 추가"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="group">
                  {columns.map((column) => (
                    <td key={column.id} className="border border-gray-200 dark:border-gray-700 p-0">
                      <div className="flex items-center justify-center min-h-[40px]">
                        {renderCellInput(row, column)}
                      </div>
                    </td>
                  ))}
                  <td className="border border-gray-200 dark:border-gray-700 p-2 w-10">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="행 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Row Button */}
          <button
            onClick={addRow}
            className="mt-2 flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 행 추가
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}
