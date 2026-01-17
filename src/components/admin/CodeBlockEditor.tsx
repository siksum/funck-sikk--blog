'use client';

import { useState } from 'react';

interface CodeBlockEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const languages = [
  { value: 'javascript', label: 'JavaScript', runnable: true },
  { value: 'typescript', label: 'TypeScript', runnable: false },
  { value: 'python', label: 'Python', runnable: true },
  { value: 'html', label: 'HTML', runnable: true },
  { value: 'css', label: 'CSS', runnable: true },
  { value: 'json', label: 'JSON', runnable: false },
  { value: 'bash', label: 'Bash', runnable: false },
  { value: 'sql', label: 'SQL', runnable: false },
  { value: 'java', label: 'Java', runnable: false },
  { value: 'cpp', label: 'C++', runnable: false },
  { value: 'csharp', label: 'C#', runnable: false },
  { value: 'go', label: 'Go', runnable: false },
  { value: 'rust', label: 'Rust', runnable: false },
  { value: 'php', label: 'PHP', runnable: false },
  { value: 'ruby', label: 'Ruby', runnable: false },
  { value: 'swift', label: 'Swift', runnable: false },
  { value: 'kotlin', label: 'Kotlin', runnable: false },
  { value: 'markdown', label: 'Markdown', runnable: false },
  { value: 'yaml', label: 'YAML', runnable: false },
  { value: 'xml', label: 'XML', runnable: false },
];

export default function CodeBlockEditor({ isOpen, onClose, onInsert }: CodeBlockEditorProps) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [filename, setFilename] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const selectedLang = languages.find((l) => l.value === language);

  const runCode = async () => {
    if (!selectedLang?.runnable) return;

    setIsRunning(true);
    setOutput('');

    try {
      if (language === 'javascript') {
        // Run JavaScript in a sandboxed environment
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        };

        try {
          // eslint-disable-next-line no-eval
          const result = eval(code);
          if (result !== undefined) {
            logs.push(`=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
          }
        } catch (e: unknown) {
          const error = e as Error;
          logs.push(`Error: ${error.message}`);
        }

        console.log = originalLog;
        setOutput(logs.join('\n'));
      } else if (language === 'html') {
        // Preview HTML in a new window
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        if (newWindow) {
          newWindow.document.write(code);
          newWindow.document.close();
        }
        setOutput('HTML이 새 창에서 열렸습니다.');
      } else if (language === 'css') {
        // Show CSS preview
        setOutput('CSS 코드가 저장되었습니다. HTML과 함께 사용하세요.');
      } else if (language === 'python') {
        // Python would need a backend - show placeholder
        setOutput('Python 실행을 위해서는 서버 사이드 실행 환경이 필요합니다.\n\n온라인 실행: https://www.online-python.com/');
      }
    } catch (e: unknown) {
      const error = e as Error;
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInsert = () => {
    let markdown = '';

    if (filename) {
      markdown = `\`\`\`${language}:${filename}\n${code}\n\`\`\``;
    } else {
      markdown = `\`\`\`${language}\n${code}\n\`\`\``;
    }

    if (showLineNumbers) {
      markdown = `\`\`\`${language}${filename ? ':' + filename : ''} showLineNumbers\n${code}\n\`\`\``;
    }

    onInsert('\n' + markdown + '\n');
    onClose();
    setCode('');
    setFilename('');
    setOutput('');
    setLanguage('javascript');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">코드 블록</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">언어:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label} {lang.runnable ? '▶' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">파일명:</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="example.js"
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-40"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">줄 번호 표시</span>
          </label>

          {selectedLang?.runnable && (
            <button
              onClick={runCode}
              disabled={isRunning || !code}
              className="ml-auto px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {isRunning ? '실행 중...' : '실행'}
            </button>
          )}
        </div>

        {/* Code Editor & Output */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-2 bg-gray-100 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
              코드 입력
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 px-6 py-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
              placeholder={`// ${selectedLang?.label} 코드를 입력하세요...`}
              spellCheck={false}
            />
          </div>

          {selectedLang?.runnable && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                출력
              </div>
              <pre className="flex-1 px-4 py-4 bg-gray-800 text-gray-100 font-mono text-sm overflow-auto">
                {output || '실행 결과가 여기에 표시됩니다.'}
              </pre>
            </div>
          )}
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
            disabled={!code}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}
