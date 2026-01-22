'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Youtube } from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import { useCallback, useEffect, useState } from 'react';
import EditorToolbar from './menus/EditorToolbar';
import BubbleMenuComponent from './menus/BubbleMenu';
import { Callout, MermaidBlock, PrivateBlock, SelectBlock } from './extensions';
import './styles/editor.css';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content: string;
  onSave: (markdown: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
}

export default function TipTapEditor({
  content,
  onSave,
  onCancel,
  placeholder = '내용을 입력하세요...',
}: TipTapEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-violet-600 dark:text-violet-400 hover:underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'youtube-wrapper',
        },
      }),
      Callout,
      MermaidBlock,
      PrivateBlock,
      SelectBlock,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-violet dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: () => {
      setHasChanges(true);
    },
  });

  // Autosave with debounce
  useEffect(() => {
    if (!editor || !hasChanges) return;

    const timer = setTimeout(async () => {
      await handleSave();
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [editor?.getHTML(), hasChanges]);

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor || isSaving) return;

    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown();
      await onSave(markdown);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, onSave]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('저장하지 않은 변경사항이 있습니다. 정말 취소하시겠습니까?');
      if (!confirmed) return;
    }
    onCancel();
  }, [hasChanges, onCancel]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="tiptap-container">
      {/* Toolbar */}
      <EditorToolbar editor={editor} onSave={handleSave} onCancel={handleCancel} />

      {/* Bubble Menu */}
      <BubbleMenuComponent editor={editor} />

      {/* Editor */}
      <div className="border-2 border-pink-200 dark:border-pink-500/40 rounded-lg overflow-hidden">
        <EditorContent editor={editor} className="min-h-[400px] p-4" />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              저장되지 않은 변경사항
            </span>
          )}
          {isSaving && (
            <span className="flex items-center gap-1">
              <span className="animate-spin w-3 h-3 border-2 border-pink-500 border-t-transparent rounded-full"></span>
              저장 중...
            </span>
          )}
          {lastSaved && !isSaving && !hasChanges && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}
            </span>
          )}
        </div>
        <div className="text-xs">
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
            Ctrl+S
          </kbd>{' '}
          저장
        </div>
      </div>
    </div>
  );
}
