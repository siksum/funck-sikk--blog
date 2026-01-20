'use client';

import { useState, useMemo, ReactNode, isValidElement } from 'react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
  title?: string;
  highlightLines?: string;
}

// Helper to extract text content from React children (for copy functionality)
function extractTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';

  if (Array.isArray(children)) {
    return children.map(extractTextContent).join('');
  }

  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    if (props.children) {
      return extractTextContent(props.children);
    }
  }

  return '';
}

// Parse highlight lines string like "1,3-5,7" into a Set of line numbers
function parseHighlightLines(highlightStr: string | undefined): Set<number> {
  const lines = new Set<number>();
  if (!highlightStr) return lines;

  const parts = highlightStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        lines.add(i);
      }
    } else {
      lines.add(Number(trimmed));
    }
  }
  return lines;
}

const COLLAPSE_THRESHOLD = 15; // 15줄 이상이면 접기 버튼 표시

export default function CodeBlock({ children, className, language, title, highlightLines }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract language from className (e.g., "language-javascript hljs" -> "javascript")
  const langMatch = className?.match(/language-(\w+)/);
  const lang = language || langMatch?.[1] || 'code';

  // Get code as string for copy functionality
  const codeString = extractTextContent(children);

  // Count lines for line numbers
  const lineCount = useMemo(() => {
    const lines = codeString.split('\n');
    return lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
  }, [codeString]);

  // Parse highlighted lines
  const highlightedLines = useMemo(() => parseHighlightLines(highlightLines), [highlightLines]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group">
      {/* Title/Filename Bar (if provided) */}
      {title && (
        <div className="flex items-center px-4 py-2 bg-gray-700 dark:bg-gray-800 rounded-t-lg border-b border-gray-600 dark:border-gray-700">
          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-mono text-gray-300">{title}</span>
        </div>
      )}

      {/* Language Badge & Controls */}
      <div className={`absolute ${title ? 'top-10' : 'top-0'} left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 ${title ? '' : 'rounded-t-lg'} border-b border-gray-700 dark:border-gray-700 z-10`}>
        <span className="text-xs font-mono text-violet-400 uppercase tracking-wide">
          {lang}
        </span>
        <div className="flex items-center gap-3">
          {/* Collapse Toggle (only for long code) */}
          {lineCount > COLLAPSE_THRESHOLD && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`text-xs transition-colors ${isCollapsed ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-200'}`}
              aria-label={isCollapsed ? '코드 펼치기' : '코드 접기'}
            >
              <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {/* Line Numbers Toggle */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`text-xs transition-colors ${showLineNumbers ? 'text-violet-400' : 'text-gray-500'}`}
            aria-label={showLineNumbers ? '줄 번호 숨기기' : '줄 번호 보기'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="코드 복사"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400">복사됨!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content with Line Numbers */}
      <div className={`overflow-x-auto pt-10 bg-gray-900 dark:bg-gray-950 ${title ? '' : 'rounded-lg'} rounded-b-lg transition-all duration-300 ${isCollapsed ? 'max-h-48 overflow-hidden' : ''}`}>
        <div className="flex">
          {/* Line Numbers Column */}
          {showLineNumbers && (
            <div className="flex-shrink-0 select-none text-right pr-4 pl-4 py-5 text-sm font-mono text-gray-500 border-r border-gray-700/50" style={{ lineHeight: '1.85' }}>
              {Array.from({ length: lineCount }, (_, i) => {
                const lineNumber = i + 1;
                const isHighlighted = highlightedLines.has(lineNumber);
                return (
                  <div
                    key={i}
                    className={`${isHighlighted ? 'text-violet-400 bg-violet-500/20' : ''}`}
                  >
                    {lineNumber}
                  </div>
                );
              })}
            </div>
          )}

          {/* Code Content */}
          <div className="flex-1 overflow-x-auto">
            <pre className="p-4 py-5 text-sm font-mono m-0 bg-transparent" style={{ lineHeight: '1.85', tabSize: 4 }}>
              <code className={className} style={{ tabSize: 4 }}>
                {children}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Collapsed Overlay */}
      {isCollapsed && (
        <div
          className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 dark:from-gray-950 to-transparent flex items-end justify-center pb-3 cursor-pointer rounded-b-lg"
          onClick={() => setIsCollapsed(false)}
        >
          <span className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            펼치기 ({lineCount}줄)
          </span>
        </div>
      )}
    </div>
  );
}
