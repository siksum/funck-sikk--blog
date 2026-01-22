'use client';

import { Editor } from '@tiptap/react';
import { useCallback, useState } from 'react';

interface EditorToolbarProps {
  editor: Editor;
  onSave: () => void;
  onCancel: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-colors ${
        isActive ? 'bg-pink-200 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-pink-200 dark:bg-pink-500/30 mx-1" />;
}

// Common programming languages for code blocks
const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'plaintext', label: 'Plain Text' },
];

// Emoji categories
const EMOJI_CATEGORIES = [
  {
    name: '자주 사용',
    emojis: ['😀', '😂', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💯'],
  },
  {
    name: '표정',
    emojis: ['😊', '😄', '😁', '😆', '😅', '🤣', '😇', '🙂', '😉', '😌', '😍', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩'],
  },
  {
    name: '손/동작',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🙏'],
  },
  {
    name: '사물',
    emojis: ['💻', '📱', '⌨️', '🖥️', '🖨️', '🔌', '💡', '📷', '📹', '🎥', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '🔔', '📣', '📢', '💾', '📀', '📁', '📂', '📋', '📝'],
  },
  {
    name: '기호',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '⚡', '🔥', '💥', '❄️', '☀️', '🌈'],
  },
  {
    name: '화살표',
    emojis: ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝'],
  },
];

export default function EditorToolbar({ editor, onSave, onCancel }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCodeLanguages, setShowCodeLanguages] = useState(false);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setShowImageInput(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    }
    setShowYoutubeInput(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-2 border-pink-200 dark:border-pink-500/40 rounded-lg p-2 mb-4 flex flex-wrap items-center gap-1">
      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게 (Ctrl+B)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임 (Ctrl+I)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m2 0l-4 16m-2 0h4" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 10H6.5m11 4H6.5M12 4v16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="인라인 코드"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </ToolbarButton>

      {/* Emoji Picker */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="이모지"
        >
          <span className="text-lg">😀</span>
        </ToolbarButton>
        {showEmojiPicker && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20 w-72 max-h-64 overflow-y-auto">
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.name} className="mb-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-1">
                  {category.name}
                </div>
                <div className="flex flex-wrap gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        editor.chain().focus().insertContent(emoji).run();
                        setShowEmojiPicker(false);
                      }}
                      className="w-7 h-7 flex items-center justify-center hover:bg-pink-100 dark:hover:bg-pink-500/20 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        <span className="font-bold text-sm">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        <span className="font-bold text-sm">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        <span className="font-bold text-sm">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="글머리 기호"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 목록"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="체크리스트"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="인용구"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </ToolbarButton>

      {/* Code Block with Language Selection */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowCodeLanguages(!showCodeLanguages)}
          isActive={editor.isActive('codeBlock')}
          title="코드 블록"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm4 7l2 2-2 2m4 0h4" />
          </svg>
        </ToolbarButton>
        {showCodeLanguages && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20 w-40 max-h-64 overflow-y-auto">
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock({ language: lang.value }).run();
                  setShowCodeLanguages(false);
                }}
                className="w-full text-left px-2 py-1 text-sm rounded hover:bg-pink-100 dark:hover:bg-pink-500/20"
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="수평선"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Insert */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive('link')}
          title="링크"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL 입력..."
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-48"
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
            />
            <button
              onClick={setLink}
              className="ml-2 px-2 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600"
            >
              확인
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton onClick={() => setShowImageInput(!showImageInput)} title="이미지">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </ToolbarButton>
        {showImageInput && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="이미지 URL 입력..."
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-48"
              onKeyDown={(e) => e.key === 'Enter' && addImage()}
            />
            <button
              onClick={addImage}
              className="ml-2 px-2 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600"
            >
              확인
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton onClick={() => setShowYoutubeInput(!showYoutubeInput)} title="YouTube">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </ToolbarButton>
        {showYoutubeInput && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="YouTube URL 입력..."
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-48"
              onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
            />
            <button
              onClick={addYoutube}
              className="ml-2 px-2 py-1 bg-pink-500 text-white rounded text-sm hover:bg-pink-600"
            >
              확인
            </button>
          </div>
        )}
      </div>

      <ToolbarDivider />

      {/* Table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="표 삽입"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </ToolbarButton>

      {editor.isActive('table') && (
        <>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="왼쪽에 열 추가">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="오른쪽에 열 추가">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="위에 행 추가">
            <span className="text-xs font-bold">+↑</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="아래에 행 추가">
            <span className="text-xs font-bold">+↓</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="행 삭제">
            <span className="text-xs font-bold">-</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="표 삭제">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
        </>
      )}

      <ToolbarDivider />

      {/* Custom Blocks */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setShowCalloutMenu(!showCalloutMenu)}
          isActive={editor.isActive('callout')}
          title="콜아웃"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </ToolbarButton>
        {showCalloutMenu && (
          <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-pink-200 dark:border-pink-500/40 z-20 w-40">
            <button
              onClick={() => {
                editor.chain().focus().setCallout({ type: 'info' }).run();
                setShowCalloutMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> 정보
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setCallout({ type: 'warning' }).run();
                setShowCalloutMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> 경고
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setCallout({ type: 'tip' }).run();
                setShowCalloutMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-green-500"></span> 팁
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setCallout({ type: 'danger' }).run();
                setShowCalloutMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-red-500"></span> 위험
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setCallout({ type: 'note' }).run();
                setShowCalloutMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-violet-500"></span> 노트
            </button>
          </div>
        )}
      </div>

      <ToolbarButton
        onClick={() => editor.chain().focus().togglePrivateBlock().run()}
        isActive={editor.isActive('privateBlock')}
        title="비공개 블록"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setMermaid({ chart: 'graph TD\n  A[시작] --> B[끝]' }).run()}
        title="Mermaid 다이어그램"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      </ToolbarButton>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-sm rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        취소
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1.5 text-sm rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
      >
        저장
      </button>
    </div>
  );
}
