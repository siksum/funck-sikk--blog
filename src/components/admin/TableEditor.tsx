'use client';

import { useState, useCallback } from 'react';

interface CellData {
  content: string;
  rowSpan: number;
  colSpan: number;
  hidden: boolean; // Hidden cells are part of a merged cell
  highlight?: string; // Background color
}

interface TableEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: '없음', value: '' },
  { name: '노랑', value: '#fef9c3' },
  { name: '초록', value: '#dcfce7' },
  { name: '파랑', value: '#dbeafe' },
  { name: '분홍', value: '#fce7f3' },
  { name: '주황', value: '#ffedd5' },
  { name: '보라', value: '#f3e8ff' },
  { name: '회색', value: '#f3f4f6' },
];

export default function TableEditor({ isOpen, onClose, onInsert }: TableEditorProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cells, setCells] = useState<CellData[][]>(() =>
    Array(4).fill(null).map((_, rowIndex) =>
      Array(3).fill(null).map(() => ({
        content: '',
        rowSpan: 1,
        colSpan: 1,
        hidden: false,
        highlight: '',
      }))
    )
  );
  const [headers, setHeaders] = useState<CellData[]>([
    { content: '열 1', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
    { content: '열 2', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
    { content: '열 3', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
  ]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [rowHighlights, setRowHighlights] = useState<string[]>(Array(3).fill(''));
  const [colHighlights, setColHighlights] = useState<string[]>(Array(3).fill(''));

  const updateTableSize = useCallback((newRows: number, newCols: number) => {
    const newCells = Array(newRows)
      .fill(null)
      .map((_, rowIndex) =>
        Array(newCols)
          .fill(null)
          .map((_, colIndex) =>
            cells[rowIndex]?.[colIndex] || {
              content: '',
              rowSpan: 1,
              colSpan: 1,
              hidden: false,
              highlight: '',
            }
          )
      );

    const newHeaders = Array(newCols)
      .fill(null)
      .map((_, index) =>
        headers[index] || {
          content: `열 ${index + 1}`,
          rowSpan: 1,
          colSpan: 1,
          hidden: false,
          highlight: '',
        }
      );

    const newRowHighlights = Array(newRows)
      .fill('')
      .map((_, index) => rowHighlights[index] || '');

    const newColHighlights = Array(newCols)
      .fill('')
      .map((_, index) => colHighlights[index] || '');

    setRows(newRows);
    setCols(newCols);
    setCells(newCells);
    setHeaders(newHeaders);
    setRowHighlights(newRowHighlights);
    setColHighlights(newColHighlights);
    setSelectedCells(new Set());
  }, [cells, headers, rowHighlights, colHighlights]);

  const updateCell = (rowIndex: number, colIndex: number, content: string) => {
    const newCells = cells.map((row, rIdx) =>
      row.map((cell, cIdx) =>
        rIdx === rowIndex && cIdx === colIndex ? { ...cell, content } : cell
      )
    );
    setCells(newCells);
  };

  const updateHeader = (colIndex: number, content: string) => {
    const newHeaders = headers.map((header, idx) =>
      idx === colIndex ? { ...header, content } : header
    );
    setHeaders(newHeaders);
  };

  const toggleCellSelection = (rowIndex: number, colIndex: number, isHeader: boolean = false) => {
    const key = isHeader ? `h-${colIndex}` : `${rowIndex}-${colIndex}`;
    const newSelected = new Set(selectedCells);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCells(newSelected);
  };

  const handleCellMouseDown = (rowIndex: number, colIndex: number, isHeader: boolean = false) => {
    setIsSelecting(true);
    const key = isHeader ? `h-${colIndex}` : `${rowIndex}-${colIndex}`;
    setSelectedCells(new Set([key]));
  };

  const handleCellMouseEnter = (rowIndex: number, colIndex: number, isHeader: boolean = false) => {
    if (!isSelecting) return;
    const key = isHeader ? `h-${colIndex}` : `${rowIndex}-${colIndex}`;
    setSelectedCells(prev => new Set([...prev, key]));
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const mergeCells = () => {
    if (selectedCells.size < 2) return;

    // Parse selected cells
    const bodyCells: { row: number; col: number }[] = [];
    selectedCells.forEach(key => {
      if (!key.startsWith('h-')) {
        const [row, col] = key.split('-').map(Number);
        bodyCells.push({ row, col });
      }
    });

    if (bodyCells.length < 2) return;

    // Find bounding rectangle
    const minRow = Math.min(...bodyCells.map(c => c.row));
    const maxRow = Math.max(...bodyCells.map(c => c.row));
    const minCol = Math.min(...bodyCells.map(c => c.col));
    const maxCol = Math.max(...bodyCells.map(c => c.col));

    // Create new cells array
    const newCells = cells.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol) {
          if (rowIndex === minRow && colIndex === minCol) {
            // This is the top-left cell - it gets the merged content
            return {
              ...cell,
              rowSpan: maxRow - minRow + 1,
              colSpan: maxCol - minCol + 1,
              hidden: false,
            };
          } else {
            // These cells are hidden (part of merged cell)
            return {
              ...cell,
              rowSpan: 1,
              colSpan: 1,
              hidden: true,
            };
          }
        }
        return cell;
      })
    );

    setCells(newCells);
    setSelectedCells(new Set());
  };

  const unmergeAll = () => {
    const newCells = cells.map(row =>
      row.map(cell => ({
        ...cell,
        rowSpan: 1,
        colSpan: 1,
        hidden: false,
      }))
    );
    setCells(newCells);
    setSelectedCells(new Set());
  };

  const setRowHighlight = (rowIndex: number, color: string) => {
    const newHighlights = [...rowHighlights];
    newHighlights[rowIndex] = color;
    setRowHighlights(newHighlights);
  };

  const setColHighlight = (colIndex: number, color: string) => {
    const newHighlights = [...colHighlights];
    newHighlights[colIndex] = color;
    setColHighlights(newHighlights);
  };

  const setCellHighlight = (rowIndex: number, colIndex: number, color: string) => {
    const newCells = cells.map((row, rIdx) =>
      row.map((cell, cIdx) =>
        rIdx === rowIndex && cIdx === colIndex ? { ...cell, highlight: color } : cell
      )
    );
    setCells(newCells);
  };

  const highlightSelectedCells = (color: string) => {
    const newCells = cells.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        if (selectedCells.has(key)) {
          return { ...cell, highlight: color };
        }
        return cell;
      })
    );

    const newHeaders = headers.map((header, colIndex) => {
      const key = `h-${colIndex}`;
      if (selectedCells.has(key)) {
        return { ...header, highlight: color };
      }
      return header;
    });

    setCells(newCells);
    setHeaders(newHeaders);
    setSelectedCells(new Set());
  };

  const getCellBackground = (rowIndex: number, colIndex: number, cell: CellData) => {
    // Priority: cell highlight > row highlight > column highlight
    if (cell.highlight) return cell.highlight;
    if (rowHighlights[rowIndex]) return rowHighlights[rowIndex];
    if (colHighlights[colIndex]) return colHighlights[colIndex];
    return '';
  };

  const generateHTML = () => {
    let html = '<table>\n';

    // Generate header row
    html += '  <thead>\n    <tr>\n';
    headers.forEach((header, colIndex) => {
      if (header.hidden) return;
      const bgColor = header.highlight || colHighlights[colIndex] || '';
      const highlight = bgColor ? ` data-highlight="${bgColor}"` : '';
      const colSpan = header.colSpan > 1 ? ` colspan="${header.colSpan}"` : '';
      html += `      <th${colSpan}${highlight}>${header.content || ''}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';

    // Generate body rows
    html += '  <tbody>\n';
    cells.forEach((row, rowIndex) => {
      html += '    <tr>\n';
      row.forEach((cell, colIndex) => {
        if (cell.hidden) return;
        const bgColor = getCellBackground(rowIndex, colIndex, cell);
        const highlight = bgColor ? ` data-highlight="${bgColor}"` : '';
        const rowSpan = cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
        const colSpan = cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
        html += `      <td${rowSpan}${colSpan}${highlight}>${cell.content || ''}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n';

    html += '</table>';
    return html;
  };

  const handleInsert = () => {
    const html = generateHTML();
    onInsert('\n' + html + '\n');
    onClose();
    // Reset
    setRows(3);
    setCols(3);
    setCells(
      Array(3).fill(null).map(() =>
        Array(3).fill(null).map(() => ({
          content: '',
          rowSpan: 1,
          colSpan: 1,
          hidden: false,
          highlight: '',
        }))
      )
    );
    setHeaders([
      { content: '열 1', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
      { content: '열 2', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
      { content: '열 3', rowSpan: 1, colSpan: 1, hidden: false, highlight: '' },
    ]);
    setRowHighlights(Array(3).fill(''));
    setColHighlights(Array(3).fill(''));
    setSelectedCells(new Set());
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
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

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
          {/* Size Controls */}
          <div className="flex items-center gap-4">
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

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Merge Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={mergeCells}
              disabled={selectedCells.size < 2}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              셀 병합
            </button>
            <button
              onClick={unmergeAll}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              병합 해제
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Highlight Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">하이라이트:</span>
            <div className="flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value || 'none'}
                  onClick={() => highlightSelectedCells(color.value)}
                  disabled={selectedCells.size === 0}
                  className={`w-6 h-6 rounded border-2 ${
                    color.value
                      ? 'border-gray-300 dark:border-gray-500'
                      : 'border-gray-400 dark:border-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform`}
                  style={{ backgroundColor: color.value || 'transparent' }}
                  title={color.name}
                >
                  {!color.value && (
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24">
                      <path stroke="currentColor" strokeWidth={2} d="M4 4l16 16" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row/Column Highlight Controls */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap gap-4">
            {/* Column Highlights */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">열 하이라이트:</span>
              {Array(cols).fill(null).map((_, colIndex) => (
                <div key={colIndex} className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">{colIndex + 1}:</span>
                  <select
                    value={colHighlights[colIndex] || ''}
                    onChange={(e) => setColHighlight(colIndex, e.target.value)}
                    className="text-xs px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {HIGHLIGHT_COLORS.map((color) => (
                      <option key={color.value || 'none'} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {/* Row Highlights */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">행 하이라이트:</span>
              {Array(rows).fill(null).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">{rowIndex + 1}:</span>
                  <select
                    value={rowHighlights[rowIndex] || ''}
                    onChange={(e) => setRowHighlight(rowIndex, e.target.value)}
                    className="text-xs px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {HIGHLIGHT_COLORS.map((color) => (
                      <option key={color.value || 'none'} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 셀을 드래그하여 선택한 후 &quot;셀 병합&quot; 버튼을 클릭하세요. 하이라이트 색상을 선택하면 선택된 셀에 적용됩니다.
          </p>
        </div>

        {/* Table Editor */}
        <div className="p-6 overflow-auto max-h-[40vh]">
          <table className="w-full border-collapse select-none">
            <thead>
              <tr>
                {headers.map((header, colIndex) => {
                  if (header.hidden) return null;
                  const isSelected = selectedCells.has(`h-${colIndex}`);
                  const bgColor = header.highlight || colHighlights[colIndex] || '';
                  return (
                    <th
                      key={colIndex}
                      colSpan={header.colSpan}
                      className={`border-2 p-0 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: isSelected ? undefined : bgColor }}
                      onMouseDown={() => handleCellMouseDown(-1, colIndex, true)}
                      onMouseEnter={() => handleCellMouseEnter(-1, colIndex, true)}
                    >
                      <input
                        type="text"
                        value={header.content}
                        onChange={(e) => updateHeader(colIndex, e.target.value)}
                        className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white font-semibold text-center focus:outline-none"
                        placeholder={`열 ${colIndex + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => {
                    if (cell.hidden) return null;
                    const isSelected = selectedCells.has(`${rowIndex}-${colIndex}`);
                    const bgColor = getCellBackground(rowIndex, colIndex, cell);
                    return (
                      <td
                        key={colIndex}
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        className={`border-2 p-0 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: isSelected ? undefined : bgColor }}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      >
                        <input
                          type="text"
                          value={cell.content}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="w-full px-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none"
                          placeholder=""
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">미리보기 (HTML):</p>
          <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-32">
            {generateHTML()}
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
