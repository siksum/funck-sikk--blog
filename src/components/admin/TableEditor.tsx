'use client';

import { useState } from 'react';

interface TableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

export default function TableEditor({ isOpen, onClose, onInsert }: TableEditorProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState<string[][]>(() =>
    Array(3).fill(null).map(() => Array(3).fill(''))
  );
  const [headers, setHeaders] = useState<string[]>(['열 1', '열 2', '열 3']);

  const updateTableSize = (newRows: number, newCols: number) => {
    const newData = Array(newRows)
      .fill(null)
      .map((_, rowIndex) =>
        Array(newCols)
          .fill('')
          .map((_, colIndex) =>
            tableData[rowIndex]?.[colIndex] || ''
          )
      );

    const newHeaders = Array(newCols)
      .fill('')
      .map((_, index) => headers[index] || `열 ${index + 1}`);

    setRows(newRows);
    setCols(newCols);
    setTableData(newData);
    setHeaders(newHeaders);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const updateHeader = (colIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = value;
    setHeaders(newHeaders);
  };

  const generateMarkdown = () => {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = tableData
      .map((row) => `| ${row.map((cell) => cell || ' ').join(' | ')} |`)
      .join('\n');

    return `${headerRow}\n${separatorRow}\n${dataRows}`;
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    onInsert('\n' + markdown + '\n');
    onClose();
    // Reset
    setRows(3);
    setCols(3);
    setTableData(Array(3).fill(null).map(() => Array(3).fill('')));
    setHeaders(['열 1', '열 2', '열 3']);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">테이블 만들기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Size Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">행:</label>
            <input
              type="number"
              min={1}
              max={20}
              value={rows}
              onChange={(e) => updateTableSize(parseInt(e.target.value) || 1, cols)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">열:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={cols}
              onChange={(e) => updateTableSize(rows, parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Table Editor */}
        <div className="p-6 overflow-auto max-h-[50vh]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {headers.map((header, colIndex) => (
                  <th key={colIndex} className="border border-gray-300 dark:border-gray-600 p-0">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`열 ${colIndex + 1}`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=""
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">미리보기 (Markdown):</p>
          <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {generateMarkdown()}
          </pre>
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
