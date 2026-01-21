'use client';

import { useState } from 'react';

interface ButtonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const buttonStyles = [
  { value: 'primary', label: '기본', className: 'bg-blue-200 hover:bg-blue-300 text-blue-800' },
  { value: 'secondary', label: '보조', className: 'bg-gray-200 hover:bg-gray-300 text-gray-700' },
  { value: 'success', label: '성공', className: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-800' },
  { value: 'danger', label: '위험', className: 'bg-rose-200 hover:bg-rose-300 text-rose-800' },
  { value: 'warning', label: '경고', className: 'bg-amber-200 hover:bg-amber-300 text-amber-800' },
  { value: 'outline', label: '외곽선', className: 'border-2 border-violet-300 text-violet-600 hover:bg-violet-50' },
];

const buttonSizes = [
  { value: 'sm', label: '작게', className: 'px-3 py-1.5 text-sm' },
  { value: 'md', label: '보통', className: 'px-4 py-2' },
  { value: 'lg', label: '크게', className: 'px-6 py-3 text-lg' },
];

export default function ButtonEditor({ isOpen, onClose, onInsert }: ButtonEditorProps) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState('primary');
  const [size, setSize] = useState('md');
  const [fullWidth, setFullWidth] = useState(false);
  const [newTab, setNewTab] = useState(true);

  const selectedStyle = buttonStyles.find((s) => s.value === style);
  const selectedSize = buttonSizes.find((s) => s.value === size);

  const handleInsert = () => {
    const widthClass = fullWidth ? 'w-full' : 'inline-block';
    const targetAttr = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';

    const markdown = `<a href="${url || '#'}"${targetAttr} class="${selectedSize?.className} ${selectedStyle?.className} ${widthClass} rounded-lg font-medium text-center transition-colors no-underline">${text || '버튼'}</a>`;

    onInsert('\n' + markdown + '\n');
    onClose();
    setText('');
    setUrl('');
    setStyle('primary');
    setSize('md');
    setFullWidth(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">버튼 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              버튼 텍스트
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="클릭하세요"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              링크 URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              스타일
            </label>
            <div className="flex flex-wrap gap-2">
              {buttonStyles.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${s.className} ${
                    style === s.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              크기
            </label>
            <div className="flex gap-2">
              {buttonSizes.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSize(s.value)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    size === s.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fullWidth}
                onChange={(e) => setFullWidth(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">전체 너비</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTab}
                onChange={(e) => setNewTab(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">새 탭에서 열기</span>
            </label>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-center">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className={`${selectedSize?.className} ${selectedStyle?.className} ${
                  fullWidth ? 'w-full' : 'inline-block'
                } rounded-lg font-medium text-center transition-colors no-underline`}
              >
                {text || '버튼'}
              </a>
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
