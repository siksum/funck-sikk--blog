'use client';

import { useState } from 'react';

interface ColumnEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

export default function ColumnEditor({ isOpen, onClose, onInsert }: ColumnEditorProps) {
  const [columnCount, setColumnCount] = useState(2);
  const [columns, setColumns] = useState<string[]>(['', '']);
  const [gap, setGap] = useState('4');

  const updateColumnCount = (count: number) => {
    const newColumns = [...columns];
    while (newColumns.length < count) {
      newColumns.push('');
    }
    while (newColumns.length > count) {
      newColumns.pop();
    }
    setColumns(newColumns);
    setColumnCount(count);
  };

  const updateColumn = (index: number, value: string) => {
    const newColumns = [...columns];
    newColumns[index] = value;
    setColumns(newColumns);
  };

  const handleInsert = () => {
    const gridClass = `grid grid-cols-${columnCount} gap-${gap}`;
    const columnsHtml = columns
      .map((content, index) => `<div>\n\n${content || `열 ${index + 1} 내용`}\n\n</div>`)
      .join('\n');

    const markdown = `<div class="${gridClass}">
${columnsHtml}
</div>`;

    onInsert('\n' + markdown + '\n');
    onClose();
    setColumns(['', '']);
    setColumnCount(2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">열 나누기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">열 수:</label>
            <select
              value={columnCount}
              onChange={(e) => updateColumnCount(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={2}>2열</option>
              <option value={3}>3열</option>
              <option value={4}>4열</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">간격:</label>
            <select
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="2">좁게</option>
              <option value="4">보통</option>
              <option value="6">넓게</option>
              <option value="8">아주 넓게</option>
            </select>
          </div>
        </div>

        {/* Column Editors */}
        <div className="flex-1 overflow-auto p-6">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
            {columns.map((content, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  열 {index + 1}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => updateColumn(index, e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  placeholder={`열 ${index + 1} 내용을 입력하세요...\n\nMarkdown 문법 사용 가능`}
                />
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className={`grid gap-${gap}`} style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                {columns.map((content, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                  >
                    {content || `열 ${index + 1} 내용`}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
