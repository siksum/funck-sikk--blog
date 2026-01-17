'use client';

import { useState } from 'react';

interface CalloutEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const calloutTypes = [
  { type: 'info', icon: 'ℹ️', label: '정보', color: 'blue' },
  { type: 'tip', icon: '💡', label: '팁', color: 'green' },
  { type: 'warning', icon: '⚠️', label: '주의', color: 'yellow' },
  { type: 'danger', icon: '🚨', label: '위험', color: 'red' },
  { type: 'note', icon: '📝', label: '노트', color: 'gray' },
  { type: 'success', icon: '✅', label: '성공', color: 'green' },
  { type: 'question', icon: '❓', label: '질문', color: 'purple' },
  { type: 'quote', icon: '💬', label: '인용', color: 'gray' },
];

export default function CalloutEditor({ isOpen, onClose, onInsert }: CalloutEditorProps) {
  const [selectedType, setSelectedType] = useState(calloutTypes[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleInsert = () => {
    const titlePart = title ? ` **${title}**` : '';
    const markdown = `> ${selectedType.icon}${titlePart}\n> \n> ${content.split('\n').join('\n> ')}\n`;
    onInsert('\n' + markdown + '\n');
    onClose();
    setTitle('');
    setContent('');
    setSelectedType(calloutTypes[0]);
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">콜아웃 추가</h2>
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
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              타입 선택
            </label>
            <div className="grid grid-cols-4 gap-2">
              {calloutTypes.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedType.type === type.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목 (선택사항)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="콜아웃 제목"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="콜아웃 내용을 입력하세요..."
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-2">
                <span className="text-xl">{selectedType.icon}</span>
                <div>
                  {title && <p className="font-bold text-gray-900 dark:text-white">{title}</p>}
                  <p className="text-gray-700 dark:text-gray-300">{content || '내용이 여기에 표시됩니다.'}</p>
                </div>
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
