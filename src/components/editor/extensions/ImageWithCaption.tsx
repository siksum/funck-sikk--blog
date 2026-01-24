'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useCallback } from 'react';

function ImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState((node.attrs.caption as string) || '');

  const handleImageClick = useCallback(() => {
    setIsEditingCaption(true);
  }, []);

  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptionText(e.target.value);
  }, []);

  const handleCaptionBlur = useCallback(() => {
    updateAttributes({ caption: captionText });
    setIsEditingCaption(false);
  }, [captionText, updateAttributes]);

  const handleCaptionKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateAttributes({ caption: captionText });
      setIsEditingCaption(false);
    }
    if (e.key === 'Escape') {
      setCaptionText((node.attrs.caption as string) || '');
      setIsEditingCaption(false);
    }
  }, [captionText, node.attrs.caption, updateAttributes]);

  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || (node.attrs.caption as string) || '';
  const title = (node.attrs.title as string) || '';
  const caption = node.attrs.caption as string | undefined;

  return (
    <NodeViewWrapper className="image-with-caption-wrapper">
      <figure className={`image-figure ${selected ? 'selected' : ''}`}>
        <img
          src={src}
          alt={alt}
          title={title}
          onClick={handleImageClick}
          className="cursor-pointer rounded-lg max-w-full h-auto"
        />
        {(isEditingCaption || caption) && (
          <figcaption className="image-caption">
            {isEditingCaption ? (
              <input
                type="text"
                value={captionText}
                onChange={handleCaptionChange}
                onBlur={handleCaptionBlur}
                onKeyDown={handleCaptionKeyDown}
                placeholder="캡션을 입력하세요..."
                autoFocus
                className="caption-input"
              />
            ) : (
              <span
                onClick={handleImageClick}
                className="caption-text cursor-pointer"
              >
                {caption}
              </span>
            )}
          </figcaption>
        )}
        {!caption && !isEditingCaption && (
          <div className="caption-hint" onClick={handleImageClick}>
            클릭하여 캡션 추가
          </div>
        )}
      </figure>
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImage: (options: { src: string; alt?: string; title?: string; caption?: string }) => ReturnType;
    };
  }
}

export const ImageWithCaption = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      caption: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
        getAttrs: (element) => {
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            title: img?.getAttribute('title'),
            caption: figcaption?.textContent || null,
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => ({
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
          title: element.getAttribute('title'),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...imgAttrs } = HTMLAttributes;

    if (caption) {
      return [
        'figure',
        { 'data-type': 'image', class: 'image-figure' },
        ['img', mergeAttributes(imgAttrs, { class: 'rounded-lg max-w-full h-auto' })],
        ['figcaption', { class: 'image-caption' }, caption],
      ];
    }

    return ['img', mergeAttributes(imgAttrs, { class: 'rounded-lg max-w-full h-auto' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
