'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CodeBlock from './CodeBlock';
import ImageLightbox from './ImageLightbox';
import Callout from './Callout';
import YouTube from './YouTube';
import { CodeTabs, Tab } from './CodeTabs';
import Mermaid from './Mermaid';
import Private from './Private';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

// Preprocess content to convert :::private blocks to <Private> components
function preprocessContent(content: string): string {
  // Match :::private ... ::: blocks (with optional newlines)
  return content.replace(
    /:::private\s*\n([\s\S]*?)\n:::/g,
    '<div class="private-content">$1</div>'
  );
}

interface MDXContentProps {
  content: string;
}

// Helper to generate ID from text
function generateId(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Anchor Link Button component
function AnchorLinkButton({ id }: { id: string }) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopyLink}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded ml-2"
      aria-label="링크 복사"
    >
      {showCopied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
    </button>
  );
}

// Parse code block meta string to extract title and highlight lines
function parseCodeMeta(metaString: string | undefined): { title?: string; highlightLines?: string } {
  if (!metaString) return {};

  const result: { title?: string; highlightLines?: string } = {};

  // Match title="..." or title='...'
  const titleMatch = metaString.match(/title=["']([^"']+)["']/);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  // Match {1,3-5,7} pattern for highlight lines
  const highlightMatch = metaString.match(/\{([0-9,\-\s]+)\}/);
  if (highlightMatch) {
    result.highlightLines = highlightMatch[1];
  }

  return result;
}

// Export custom components for use in MDX files
export const mdxComponents = {
  Callout,
  YouTube,
  CodeTabs,
  Tab,
  Mermaid,
  Private,
};

export default function MDXContent({ content }: MDXContentProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <article className="max-w-none" style={{ color: 'var(--foreground)' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
          components={{
            h1: ({ children }) => {
              const id = generateId(String(children));
              return (
                <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24 group flex items-center" style={{ color: 'var(--foreground)' }}>
                  {children}
                  <AnchorLinkButton id={id} />
                </h1>
              );
            },
            h2: ({ children }) => {
              const id = generateId(String(children));
              return (
                <h2 id={id} className="text-2xl font-bold mt-8 mb-4 scroll-mt-24 group flex items-center" style={{ color: 'var(--foreground)' }}>
                  {children}
                  <AnchorLinkButton id={id} />
                </h2>
              );
            },
            h3: ({ children }) => {
              const id = generateId(String(children));
              return (
                <h3 id={id} className="text-xl font-bold mt-6 mb-3 scroll-mt-24 group flex items-center" style={{ color: 'var(--foreground)' }}>
                  {children}
                  <AnchorLinkButton id={id} />
                </h3>
              );
            },
            p: ({ children }) => (
              <p className="leading-relaxed mb-4" style={{ color: 'var(--foreground)' }}>
                {children}
              </p>
            ),
            ul: ({ children, className }) => (
              <ul
                className={`${className?.includes('contains-task-list') ? 'list-none' : 'list-disc list-inside'} mb-4 space-y-2`}
                style={{ color: 'var(--foreground)' }}
              >
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2" style={{ color: 'var(--foreground)' }}>
                {children}
              </ol>
            ),
            li: ({ children, className }) => (
              <li
                className={className?.includes('task-list-item') ? 'flex items-start gap-2' : ''}
                style={{ color: 'var(--foreground)' }}
              >
                {children}
              </li>
            ),
            code: ({ className, children, node, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-500/20 rounded text-sm text-violet-700 dark:text-violet-300 font-mono">
                    {children}
                  </code>
                );
              }

              // Check for mermaid code blocks
              if (className === 'language-mermaid') {
                const code = String(children).replace(/\n$/, '');
                return <Mermaid chart={code} />;
              }

              // Extract meta from data attributes if available
              const meta = (props as Record<string, unknown>)['data-meta'] as string | undefined;
              const { title, highlightLines } = parseCodeMeta(meta);

              return (
                <CodeBlock className={className} title={title} highlightLines={highlightLines}>
                  {children}
                </CodeBlock>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden mb-4">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="relative my-6 pl-6 pr-4 py-4 rounded-r-lg border-l-4 border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-500/10">
                <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-violet-500 dark:bg-violet-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <div className="italic" style={{ color: 'var(--foreground)' }}>
                  {children}
                </div>
              </blockquote>
            ),
            a: ({ href, children, className, target, rel }) => {
              // Check if it's a PDF link (starts with 📄 emoji or ends with .pdf)
              const childText = String(children);
              const isPdfLink = childText.startsWith('📄') || href?.toLowerCase().endsWith('.pdf') || href?.includes('/raw/upload/');

              if (isPdfLink && href) {
                const fileName = childText.replace('📄 ', '').trim() || 'PDF 파일';
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 my-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h4v1h-4v-1zm0 2h4v1h-4v-1zm-2-2h1v4h-1v-4zm0-2h6v1H8v-1z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{fileName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">PDF 파일 · 클릭하여 열기</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                );
              }

              return (
                <a
                  href={href}
                  className={className || "text-violet-600 dark:text-violet-400 hover:underline underline-offset-2 decoration-violet-400/50"}
                  target={target || (href?.startsWith('http') ? '_blank' : undefined)}
                  rel={rel || (href?.startsWith('http') ? 'noopener noreferrer' : undefined)}
                >
                  {children}
                </a>
              );
            },
            strong: ({ children }) => (
              <strong className="font-bold" style={{ color: 'var(--foreground)' }}>
                {children}
              </strong>
            ),
            del: ({ children }) => (
              <del className="line-through text-gray-500 dark:text-gray-400">
                {children}
              </del>
            ),
            details: ({ children, ...props }) => (
              <details
                className="my-4 border border-violet-200 dark:border-violet-500/30 rounded-lg overflow-hidden"
                {...props}
              >
                {children}
              </details>
            ),
            summary: ({ children }) => (
              <summary className="px-4 py-3 bg-violet-50 dark:bg-violet-500/10 cursor-pointer font-medium hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors" style={{ color: 'var(--foreground)' }}>
                {children}
              </summary>
            ),
            div: ({ className, children, ...props }) => {
              // Check for callout classes
              if (className?.startsWith('callout-')) {
                const type = className.replace('callout-', '') as 'info' | 'warning' | 'tip' | 'danger' | 'note';
                return <Callout type={type}>{children}</Callout>;
              }
              // Check for private content
              if (className === 'private-content') {
                return <Private>{children}</Private>;
              }
              return (
                <div className={className} {...props}>
                  {children}
                </div>
              );
            },
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 -mx-4 px-4 sm:-mx-0 sm:px-0">
                <table className="w-max min-w-full border-collapse border border-violet-200 dark:border-violet-500/30">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-violet-50 dark:bg-violet-500/10">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="border-b border-violet-200 dark:border-violet-500/30">{children}</tr>
            ),
            th: ({ children, style, rowSpan, colSpan }) => (
              <th
                className="px-4 py-2 text-left font-semibold border border-violet-200 dark:border-violet-500/30 whitespace-nowrap"
                style={{ color: 'var(--foreground)', minWidth: '80px', ...style }}
                rowSpan={rowSpan}
                colSpan={colSpan}
              >
                {children}
              </th>
            ),
            td: ({ children, style, rowSpan, colSpan }) => (
              <td
                className="px-4 py-2 border border-violet-200 dark:border-violet-500/30"
                style={{ color: 'var(--foreground)', minWidth: '80px', ...style }}
                rowSpan={rowSpan}
                colSpan={colSpan}
              >
                {children}
              </td>
            ),
            input: ({ type, checked, ...props }) => {
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-2 w-4 h-4 accent-violet-500"
                    {...props}
                  />
                );
              }
              return <input type={type} {...props} />;
            },
            hr: () => (
              <hr className="my-8 border-t border-violet-200 dark:border-violet-500/30" />
            ),
            // Preserve span styles (for text color)
            span: ({ style, children, ...props }) => {
              // Convert style string to object if needed
              const styleObj = typeof style === 'string'
                ? style.split(';').filter(Boolean).reduce((acc, rule) => {
                    const [prop, value] = rule.split(':').map(s => s.trim());
                    if (prop && value) {
                      // Convert CSS property to camelCase
                      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                      acc[camelProp] = value;
                    }
                    return acc;
                  }, {} as Record<string, string>)
                : style;
              return (
                <span style={styleObj} {...props}>
                  {children}
                </span>
              );
            },
            // Preserve mark styles (for highlights)
            mark: ({ style, children, ...props }) => {
              // Convert style string to object if needed
              const styleObj = typeof style === 'string'
                ? style.split(';').filter(Boolean).reduce((acc, rule) => {
                    const [prop, value] = rule.split(':').map(s => s.trim());
                    if (prop && value) {
                      // Convert CSS property to camelCase
                      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                      acc[camelProp] = value;
                    }
                    return acc;
                  }, {} as Record<string, string>)
                : style;
              return (
                <mark style={styleObj} {...props}>
                  {children}
                </mark>
              );
            },
            img: ({ src, alt }) => {
              const imgSrc = typeof src === 'string' ? src : '';
              return (
                <button
                  onClick={() => setLightboxImage({ src: imgSrc, alt: alt || '' })}
                  className="block w-full cursor-zoom-in"
                >
                  <img
                    src={imgSrc}
                    alt={alt || ''}
                    className="rounded-lg my-4 shadow-lg max-w-full h-auto hover:shadow-xl transition-shadow"
                  />
                </button>
              );
            },
            // Keyboard key styling
            kbd: ({ children }) => (
              <kbd className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm" style={{ color: 'var(--foreground)' }}>
                {children}
              </kbd>
            ),
            // Footnotes styling
            sup: ({ children, ...props }) => (
              <sup className="text-violet-600 dark:text-violet-400 text-xs" {...props}>
                {children}
              </sup>
            ),
            // Footnote section styling
            section: ({ className, children, ...props }) => {
              if (className?.includes('footnotes')) {
                return (
                  <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700" {...props}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>각주</h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
                  </section>
                );
              }
              return <section className={className} {...props}>{children}</section>;
            },
          }}
        >
          {preprocessContent(content)}
        </ReactMarkdown>
      </article>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
