'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

// Initialize mermaid with configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#8b5cf6',
    primaryTextColor: '#fff',
    primaryBorderColor: '#7c3aed',
    lineColor: '#6b7280',
    secondaryColor: '#a78bfa',
    tertiaryColor: '#f3f4f6',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !chart) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('다이어그램을 렌더링하는 중 오류가 발생했습니다.');
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
