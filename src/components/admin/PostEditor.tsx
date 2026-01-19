'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MDXContent from '@/components/mdx/MDXContent';
import TableEditor from './TableEditor';
import DatabaseEditor from './DatabaseEditor';
import CalloutEditor from './CalloutEditor';
import CodeBlockEditor from './CodeBlockEditor';
import ToggleEditor from './ToggleEditor';
import ColumnEditor from './ColumnEditor';
import MathEditor from './MathEditor';
import ButtonEditor from './ButtonEditor';

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  children: DBCategory[];
}

interface PostEditorProps {
  initialData?: {
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    content?: string;
    date?: string;
  };
  isEdit?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement, content: string, setContent: (c: string) => void) => void;
}

export default function PostEditor({ initialData = {}, isEdit = false }: PostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('split');
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [showDatabaseEditor, setShowDatabaseEditor] = useState(false);
  const [showCalloutEditor, setShowCalloutEditor] = useState(false);
  const [showCodeBlockEditor, setShowCodeBlockEditor] = useState(false);
  const [showToggleEditor, setShowToggleEditor] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [showButtonEditor, setShowButtonEditor] = useState(false);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [formData, setFormData] = useState({
    slug: initialData.slug || '',
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || '',
    tags: initialData.tags?.join(', ') || '',
    content: initialData.content || '',
    date: initialData.date || '',
  });

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // First sync categories from MDX
        await fetch('/api/admin/categories/sync', { method: 'POST' });
        // Then fetch
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Build flat list of category options with path format
  const getCategoryOptions = () => {
    const options: { value: string; label: string }[] = [];
    categories.forEach((parent) => {
      options.push({ value: parent.name, label: parent.name });
      parent.children?.forEach((child) => {
        options.push({ value: `${parent.name}/${child.name}`, label: `${parent.name}/${child.name}` });
      });
    });
    return options;
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText =
      formData.content.substring(0, start) +
      before +
      selectedText +
      after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const content = formData.content;

    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
      lineStart--;
    }

    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData({ ...formData, content: formData.content + markdown });
      return;
    }

    const start = textarea.selectionStart;
    const newContent =
      formData.content.substring(0, start) +
      markdown +
      formData.content.substring(start);

    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + markdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: <span className="font-bold">B</span>,
      label: '굵게',
      action: () => insertText('**', '**'),
    },
    {
      icon: <span className="italic">I</span>,
      label: '기울임',
      action: () => insertText('*', '*'),
    },
    {
      icon: <span className="line-through">S</span>,
      label: '취소선',
      action: () => insertText('~~', '~~'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
      label: '제목 1',
      action: () => insertAtLineStart('# '),
    },
    {
      icon: <span className="text-sm font-semibold">H2</span>,
      label: '제목 2',
      action: () => insertAtLineStart('## '),
    },
    {
      icon: <span className="text-xs font-semibold">H3</span>,
      label: '제목 3',
      action: () => insertAtLineStart('### '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: '목록',
      action: () => insertAtLineStart('- '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 4h14M3 8l4 4-4 4" />
        </svg>
      ),
      label: '번호 목록',
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '인라인 코드',
      action: () => insertText('`', '`'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '코드 블록',
      action: () => insertText('\n```\n', '\n```\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: '링크',
      action: () => insertText('[', '](url)'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '이미지',
      action: () => insertText('![alt](', ')'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      label: '인용',
      action: () => insertAtLineStart('> '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      ),
      label: '구분선',
      action: () => insertText('\n---\n', ''),
    },
  ];

  const specialButtons = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18M9 6v12M15 6v12" />
        </svg>
      ),
      label: '테이블',
      action: () => setShowTableEditor(true),
    },
    {
      icon: <span className="text-sm">📊</span>,
      label: '데이터베이스',
      action: () => setShowDatabaseEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      label: '목차',
      action: () => insertMarkdown('\n## 목차\n\n- [섹션 1](#섹션-1)\n- [섹션 2](#섹션-2)\n- [섹션 3](#섹션-3)\n\n'),
    },
    {
      icon: <span className="text-sm font-mono">∑</span>,
      label: '수학 공식',
      action: () => setShowMathEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      label: '버튼',
      action: () => setShowButtonEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      label: '토글',
      action: () => setShowToggleEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      label: '열 나누기',
      action: () => setShowColumnEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '코드 블록 (고급)',
      action: () => setShowCodeBlockEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: '체크박스',
      action: () => insertAtLineStart('- [ ] '),
    },
    {
      icon: <span className="text-sm">💡</span>,
      label: '콜아웃',
      action: () => setShowCalloutEditor(true),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        tags: tagsArray,
      };

      const url = isEdit ? `/api/posts/${formData.slug}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meta Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            슬러그 (URL)
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="my-awesome-post"
            required
            disabled={isEdit}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            카테고리
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">카테고리 선택</option>
            {getCategoryOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          제목
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="포스트 제목"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          설명
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="포스트 설명"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React, Next.js, TypeScript"
        />
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          편집
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          미리보기
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('split')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'split'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          분할 보기
        </button>
      </div>

      {/* Content Editor & Preview */}
      <div
        className={`${
          activeTab === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''
        }`}
      >
        {/* Editor */}
        {(activeTab === 'edit' || activeTab === 'split') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용 (Markdown)
            </label>

            {/* Toolbar */}
            <div className="bg-gray-100 dark:bg-gray-700 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg">
              {/* Basic formatting buttons */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-600">
                {toolbarButtons.map((button, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => button.action(textareaRef.current!, formData.content, (c) => setFormData({ ...formData, content: c }))}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title={button.label}
                  >
                    {button.icon}
                  </button>
                ))}
              </div>
              {/* Special block buttons with labels */}
              <div className="flex flex-wrap gap-1 p-2">
                {specialButtons.map((button, index) => (
                  <button
                    key={`special-${index}`}
                    type="button"
                    onClick={button.action}
                    className="px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    title={button.label}
                  >
                    {button.icon}
                    <span>{button.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-[450px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="# 포스트 내용을 작성하세요..."
            />
          </div>
        )}

        {/* Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div className="h-[500px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              {formData.content || formData.title ? (
                <div className="p-6">
                  {/* Post Header Preview */}
                  <header className="mb-6 pb-6 border-b-2 border-violet-400 dark:border-violet-500">
                    {formData.category && (
                      <div className="flex items-center text-sm mb-3" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                        <span>Blog</span>
                        <span className="mx-2">/</span>
                        <span className="text-violet-600 dark:text-violet-400">{formData.category}</span>
                      </div>
                    )}
                    {formData.title && (
                      <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                        {formData.title}
                      </h1>
                    )}
                    {formData.description && (
                      <p className="text-base mb-4" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                        {formData.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                      <time>{formData.date || new Date().toLocaleDateString('ko-KR')}</time>
                      {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').filter(Boolean).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </header>
                  {/* Content Preview */}
                  <MDXContent content={formData.content} />
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center mt-20">
                  내용을 입력하면 미리보기가 표시됩니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : isEdit ? '수정하기' : '작성하기'}
        </button>
      </div>

      {/* Table Editor Modal */}
      <TableEditor
        isOpen={showTableEditor}
        onClose={() => setShowTableEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Database Editor Modal */}
      <DatabaseEditor
        isOpen={showDatabaseEditor}
        onClose={() => setShowDatabaseEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Callout Editor Modal */}
      <CalloutEditor
        isOpen={showCalloutEditor}
        onClose={() => setShowCalloutEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Code Block Editor Modal */}
      <CodeBlockEditor
        isOpen={showCodeBlockEditor}
        onClose={() => setShowCodeBlockEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Toggle Editor Modal */}
      <ToggleEditor
        isOpen={showToggleEditor}
        onClose={() => setShowToggleEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Column Editor Modal */}
      <ColumnEditor
        isOpen={showColumnEditor}
        onClose={() => setShowColumnEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Math Editor Modal */}
      <MathEditor
        isOpen={showMathEditor}
        onClose={() => setShowMathEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Button Editor Modal */}
      <ButtonEditor
        isOpen={showButtonEditor}
        onClose={() => setShowButtonEditor(false)}
        onInsert={insertMarkdown}
      />
    </form>
  );
}
