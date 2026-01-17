'use client';

import { useState } from 'react';

interface MathEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

const mathTemplates = [
  { label: '분수', template: '\\frac{a}{b}', preview: 'a/b' },
  { label: '제곱근', template: '\\sqrt{x}', preview: '√x' },
  { label: 'n제곱근', template: '\\sqrt[n]{x}', preview: 'ⁿ√x' },
  { label: '지수', template: 'x^{n}', preview: 'xⁿ' },
  { label: '아래첨자', template: 'x_{i}', preview: 'xᵢ' },
  { label: '합', template: '\\sum_{i=1}^{n}', preview: 'Σ' },
  { label: '적분', template: '\\int_{a}^{b}', preview: '∫' },
  { label: '극한', template: '\\lim_{x \\to \\infty}', preview: 'lim' },
  { label: '행렬', template: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', preview: '[행렬]' },
  { label: '그리스 문자', template: '\\alpha, \\beta, \\gamma, \\pi', preview: 'α,β,γ,π' },
];

export default function MathEditor({ isOpen, onClose, onInsert }: MathEditorProps) {
  const [formula, setFormula] = useState('');
  const [isBlock, setIsBlock] = useState(true);

  const insertTemplate = (template: string) => {
    setFormula((prev) => prev + template);
  };

  const handleInsert = () => {
    let markdown = '';
    if (isBlock) {
      markdown = `$$\n${formula}\n$$`;
    } else {
      markdown = `$${formula}$`;
    }

    onInsert('\n' + markdown + '\n');
    onClose();
    setFormula('');
    setIsBlock(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">수학 공식 (LaTeX)</h2>
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
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Display Mode */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="displayMode"
                checked={isBlock}
                onChange={() => setIsBlock(true)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">블록 수식 (중앙 정렬)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="displayMode"
                checked={!isBlock}
                onChange={() => setIsBlock(false)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">인라인 수식 (문장 내)</span>
            </label>
          </div>

          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              빠른 삽입
            </label>
            <div className="flex flex-wrap gap-2">
              {mathTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertTemplate(template.template)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={template.template}
                >
                  <span className="mr-1">{template.preview}</span>
                  <span className="text-xs text-gray-500">({template.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formula Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              LaTeX 수식
            </label>
            <textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full h-32 px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="예: E = mc^{2}"
            />
          </div>

          {/* Common Symbols Reference */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              자주 사용하는 기호
            </label>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
              <p>그리스: \alpha α, \beta β, \gamma γ, \delta δ, \pi π, \theta θ, \lambda λ, \sigma σ</p>
              <p>연산자: \times ×, \div ÷, \pm ±, \cdot ·, \leq ≤, \geq ≥, \neq ≠, \approx ≈</p>
              <p>화살표: \rightarrow →, \leftarrow ←, \Rightarrow ⇒, \Leftrightarrow ⇔</p>
              <p>집합: \in ∈, \subset ⊂, \cup ∪, \cap ∩, \emptyset ∅, \infty ∞</p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기 (Markdown 출력)
            </label>
            <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
              {isBlock ? `$$\n${formula || 'E = mc^{2}'}\n$$` : `$${formula || 'E = mc^{2}'}$`}
            </pre>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>💡 팁: 블로그에서 수식을 렌더링하려면 KaTeX 또는 MathJax 라이브러리가 필요합니다.</p>
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
            disabled={!formula}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}
