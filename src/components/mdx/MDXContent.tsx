'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';
import ImageLightbox from './ImageLightbox';

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

export default function MDXContent({ content }: MDXContentProps) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <article className="max-w-none" style={{ color: 'var(--foreground)' }}>
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
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
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-2" style={{ color: 'var(--foreground)' }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2" style={{ color: 'var(--foreground)' }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ color: 'var(--foreground)' }}>{children}</li>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-500/20 rounded text-sm text-violet-700 dark:text-violet-300 font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <CodeBlock className={className}>
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
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-violet-600 dark:text-violet-400 hover:underline underline-offset-2 decoration-violet-400/50"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-bold" style={{ color: 'var(--foreground)' }}>
                {children}
              </strong>
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
            div: ({ className, children, ...props }) => (
              <div className={className} {...props}>
                {children}
              </div>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-violet-200 dark:border-violet-500/30">
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
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold border border-violet-200 dark:border-violet-500/30" style={{ color: 'var(--foreground)' }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 border border-violet-200 dark:border-violet-500/30" style={{ color: 'var(--foreground)' }}>
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
          }}
        >
          {content}
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
