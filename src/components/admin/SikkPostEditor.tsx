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

interface SikkPostEditorProps {
  initialData?: {
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    content?: string;
    date?: string;
    isPublic?: boolean;
    thumbnail?: string;
  };
  isEdit?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement, content: string, setContent: (c: string) => void) => void;
}

export default function SikkPostEditor({ initialData = {}, isEdit = false }: SikkPostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // Parse initial category into parent and sub
  const parseCategory = (category: string) => {
    if (!category) return { parent: '', sub: '' };
    const parts = category.split('/');
    return { parent: parts[0], sub: parts[1] || '' };
  };

  const initialCategoryParsed = parseCategory(initialData.category || '');
  const [selectedParentCategory, setSelectedParentCategory] = useState(initialCategoryParsed.parent);
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialCategoryParsed.sub);

  // Get local date string to avoid UTC timezone issues
  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    slug: initialData.slug || '',
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || '',
    tags: initialData.tags?.join(', ') || '',
    content: initialData.content || '',
    date: initialData.date || getLocalDateStr(),
    isPublic: initialData.isPublic !== false,
    thumbnail: initialData.thumbnail || '',
  });

  // Update formData.category when parent or sub category changes
  useEffect(() => {
    const newCategory = selectedSubCategory
      ? `${selectedParentCategory}/${selectedSubCategory}`
      : selectedParentCategory;
    setFormData(prev => ({ ...prev, category: newCategory }));
  }, [selectedParentCategory, selectedSubCategory]);

  // Get subcategories for selected parent
  const getSubcategories = () => {
    const parent = categories.find(c => c.name === selectedParentCategory);
    return parent?.children || [];
  };

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // First sync categories from MDX
        await fetch('/api/admin/sikk-categories/sync', { method: 'POST' });
        // Then fetch
        const res = await fetch('/api/admin/sikk-categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch sikk categories:', error);
      }
    };
    fetchCategories();
  }, []);

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

    setTimeout(() => {
      textarea.focus();
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

  // File upload function (images and PDFs)
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Generate appropriate markdown based on file type
      let markdown: string;
      if (file.type === 'application/pdf') {
        markdown = `[📄 ${file.name}](${data.url})`;
      } else {
        markdown = `![${file.name}](${data.url})`;
      }

      insertMarkdown(markdown);
    } catch (error) {
      alert(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      uploadFile(file);
    }
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
      label: '이미지 업로드',
      action: () => fileInputRef.current?.click(),
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
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: '비공개',
      action: () => insertMarkdown('\n:::private\n이 내용은 로그인한 사용자만 볼 수 있습니다.\n:::\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      label: 'PDF 업로드',
      action: () => pdfInputRef.current?.click(),
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

      const url = isEdit ? `/api/sikk/${formData.slug}` : '/api/sikk';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/sikk');
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="my-study-post"
            required
            disabled={isEdit}
          />
        </div>

        {/* Category - Two-step selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            카테고리
          </label>
          <div className="flex gap-2">
            {/* Parent Category */}
            <select
              value={selectedParentCategory}
              onChange={(e) => {
                setSelectedParentCategory(e.target.value);
                setSelectedSubCategory(''); // Reset subcategory when parent changes
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">상위 카테고리</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Subcategory - only show if parent has children */}
            {selectedParentCategory && getSubcategories().length > 0 && (
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">하위 카테고리 (선택)</option>
                {getSubcategories().map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Show selected category path */}
          {formData.category && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              선택됨: {formData.category}
            </p>
          )}
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
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
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
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="포스트 설명"
        />
      </div>

      {/* Thumbnail/Banner Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          배너 이미지
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="이미지 URL 또는 파일 업로드"
          />
          <label className="px-4 py-2 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            업로드
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formDataUpload = new FormData();
                  formDataUpload.append('file', file);
                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataUpload,
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({ ...prev, thumbnail: data.url }));
                  }
                } catch (error) {
                  alert('이미지 업로드에 실패했습니다.');
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
        </div>
        {formData.thumbnail && (
          <div className="mt-2 relative">
            <img
              src={formData.thumbnail}
              alt="Banner preview"
              className="w-full max-h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, thumbnail: '' })}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tags & Date & Public */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            태그 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Solidity, Smart Contract"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={formData.date || getLocalDateStr()}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center pt-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">공개</span>
          </label>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
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
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
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
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
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
          <div className="relative">
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

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Hidden file input for PDF upload */}
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="hidden"
            />

            {/* Upload indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-700/80 flex items-center justify-center z-10 rounded-b-lg">
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">업로드 중...</span>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono text-sm resize-none"
              placeholder="# 포스트 내용을 작성하세요... (이미지를 붙여넣거나 드래그앤드롭하세요)"
            />
          </div>
        )}

        {/* Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div className="h-[650px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              {formData.content || formData.title ? (
                <div className="p-6 text-gray-900 dark:text-gray-100">
                  {/* Post Header Preview */}
                  <header className="mb-6 pb-6 border-b-2 border-pink-400 dark:border-pink-500">
                    {formData.category && (
                      <div className="flex items-center text-sm mb-3 text-gray-600 dark:text-gray-400">
                        <span>Sikk</span>
                        <span className="mx-2">/</span>
                        <span className="text-pink-600 dark:text-pink-400">{formData.category}</span>
                      </div>
                    )}
                    {formData.title && (
                      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                        {formData.title}
                      </h1>
                    )}
                    {formData.description && (
                      <p className="text-base mb-4 text-gray-700 dark:text-gray-300">
                        {formData.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <time>{formData.date || new Date().toLocaleDateString('ko-KR')}</time>
                      {!formData.isPublic && (
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          비공개
                        </span>
                      )}
                      {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').filter(Boolean).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
          className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
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
