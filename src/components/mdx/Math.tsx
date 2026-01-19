'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  children: string;
  display?: boolean;
}

export default function Math({ children, display = false }: MathProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(children, containerRef.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        if (containerRef.current) {
          containerRef.current.textContent = children;
        }
      }
    }
  }, [children, display]);

  if (display) {
    return (
      <div className="my-4 overflow-x-auto">
        <span ref={containerRef} className="block text-center" />
      </div>
    );
  }

  return <span ref={containerRef} />;
}

// Inline math component
export function InlineMath({ children }: { children: string }) {
  return <Math display={false}>{children}</Math>;
}

// Block/Display math component
export function BlockMath({ children }: { children: string }) {
  return <Math display={true}>{children}</Math>;
}
