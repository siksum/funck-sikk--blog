'use client';

import { useState, useMemo } from 'react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language?: string;
  title?: string;
  highlightLines?: string;
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

export default function CodeBlock({ children, className, language, title, highlightLines }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  // Extract language from className (e.g., "language-javascript" -> "javascript")
  const lang = language || className?.replace('language-', '') || 'code';

  // Get code as string and split into lines
  const codeString = typeof children === 'string' ? children : String(children);
  const lines = codeString.split('\n');
  // Remove last empty line if exists
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

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
      <div className={`absolute ${title ? 'top-10' : 'top-0'} left-0 right-0 flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 ${title ? '' : 'rounded-t-lg'} border-b border-gray-700 dark:border-gray-700`}>
        <span className="text-xs font-mono text-violet-400 uppercase tracking-wide">
          {lang}
        </span>
        <div className="flex items-center gap-3">
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
      <div className={`overflow-x-auto ${title ? 'pt-10' : 'pt-10'} bg-gray-900 dark:bg-gray-950 ${title ? '' : 'rounded-lg'} rounded-b-lg`}>
        <table className="w-full">
          <tbody>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlightedLines.has(lineNumber);
              return (
                <tr
                  key={index}
                  className={`${isHighlighted ? 'bg-violet-500/20 border-l-2 border-violet-500' : 'hover:bg-gray-800/50'}`}
                >
                  {showLineNumbers && (
                    <td className={`select-none text-right pr-4 pl-4 text-sm font-mono w-12 align-top ${isHighlighted ? 'text-violet-400' : 'text-gray-500'}`}>
                      {lineNumber}
                    </td>
                  )}
                  <td className="pr-4 pl-2 text-sm text-gray-100 font-mono whitespace-pre">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
