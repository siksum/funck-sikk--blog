'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { useCallback, useState } from 'react';

interface BubbleMenuComponentProps {
  editor: Editor;
}

export default function BubbleMenuComponent({ editor }: BubbleMenuComponentProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40"
    >
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL 입력..."
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded w-40"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') setLink();
              if (e.key === 'Escape') setShowLinkInput(false);
            }}
          />
          <button
            onClick={setLink}
            className="p-1 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded"
            title="확인"
          >
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={() => setShowLinkInput(false)}
            className="p-1 hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded"
            title="취소"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 ${
              editor.isActive('bold') ? 'bg-pink-200 dark:bg-pink-500/30' : ''
            }`}
            title="굵게"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 ${
              editor.isActive('italic') ? 'bg-pink-200 dark:bg-pink-500/30' : ''
            }`}
            title="기울임"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m2 0l-4 16m-2 0h4" />
            </svg>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 ${
              editor.isActive('strike') ? 'bg-pink-200 dark:bg-pink-500/30' : ''
            }`}
            title="취소선"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 10H6.5m11 4H6.5M12 4v16" />
            </svg>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 ${
              editor.isActive('code') ? 'bg-pink-200 dark:bg-pink-500/30' : ''
            }`}
            title="코드"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

          <div className="w-px h-4 bg-pink-200 dark:bg-pink-500/30 mx-1" />

          <button
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href;
              setLinkUrl(previousUrl || '');
              setShowLinkInput(true);
            }}
            className={`p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 ${
              editor.isActive('link') ? 'bg-pink-200 dark:bg-pink-500/30' : ''
            }`}
            title="링크"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {editor.isActive('link') && (
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="p-1 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20"
              title="링크 제거"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </>
      )}
    </BubbleMenu>
  );
}
