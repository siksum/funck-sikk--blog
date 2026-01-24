import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageWithCaptionOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
      updateImageCaption: (caption: string) => ReturnType;
    };
  }
}

export const ImageWithCaption = Node.create<ImageWithCaptionOptions>({
  name: 'imageWithCaption',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  draggable: true,

  isolating: true,

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
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-with-caption"]',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            title: img?.getAttribute('title'),
            caption: figcaption?.textContent || '',
          };
        },
      },
      {
        tag: 'figure:has(img)',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const img = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            caption: figcaption?.textContent || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Only render figcaption if there's caption content
    const hasCaption = node.content.size > 0 || (HTMLAttributes.caption && HTMLAttributes.caption.trim() !== '');

    if (hasCaption) {
      return [
        'figure',
        mergeAttributes(this.options.HTMLAttributes, { 'data-type': 'image-with-caption', class: 'image-with-caption' }),
        [
          'img',
          mergeAttributes({
            src: HTMLAttributes.src,
            alt: HTMLAttributes.alt,
            title: HTMLAttributes.title,
          }),
        ],
        ['figcaption', { class: 'image-caption' }, 0],
      ];
    }

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, { 'data-type': 'image-with-caption', class: 'image-with-caption' }),
      [
        'img',
        mergeAttributes({
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt,
          title: HTMLAttributes.title,
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setImageWithCaption:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: options.caption ? [{ type: 'text', text: options.caption }] : [],
          });
        },
      updateImageCaption:
        (caption) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { caption });
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement('figure');
      container.classList.add('image-with-caption');
      container.setAttribute('data-type', 'image-with-caption');
      container.draggable = true;
      container.style.position = 'relative';

      // Image wrapper for positioning toolbar
      const imgWrapper = document.createElement('div');
      imgWrapper.style.position = 'relative';
      imgWrapper.style.display = 'inline-block';
      imgWrapper.style.width = '100%';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      if (node.attrs.title) img.title = node.attrs.title;
      img.classList.add('rounded-xl', 'max-w-full', 'h-auto');
      img.style.cursor = 'pointer';
      img.style.display = 'block';

      // Toolbar (hidden by default)
      const toolbar = document.createElement('div');
      toolbar.classList.add('image-toolbar');
      toolbar.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        display: none;
        gap: 4px;
        z-index: 10;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 8px;
        padding: 4px;
      `;

      // Caption button
      const captionBtn = document.createElement('button');
      captionBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      captionBtn.title = '캡션 추가/편집';
      captionBtn.style.cssText = `
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      captionBtn.onmouseenter = () => { captionBtn.style.background = 'rgba(255,255,255,0.2)'; };
      captionBtn.onmouseleave = () => { captionBtn.style.background = 'transparent'; };

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      deleteBtn.title = '이미지 삭제';
      deleteBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      deleteBtn.onmouseenter = () => { deleteBtn.style.background = 'rgba(239,68,68,0.2)'; };
      deleteBtn.onmouseleave = () => { deleteBtn.style.background = 'transparent'; };

      toolbar.appendChild(captionBtn);
      toolbar.appendChild(deleteBtn);

      // Caption wrapper (hidden when empty)
      const captionWrapper = document.createElement('figcaption');
      captionWrapper.classList.add('image-caption');
      captionWrapper.contentEditable = 'true';
      captionWrapper.setAttribute('data-placeholder', '캡션을 입력하세요...');

      // Update visibility based on content
      const updateCaptionVisibility = () => {
        const hasContent = captionWrapper.textContent?.trim() !== '';
        if (hasContent) {
          captionWrapper.style.display = 'block';
        } else if (!captionWrapper.matches(':focus')) {
          captionWrapper.style.display = 'none';
        }
      };

      // Initial visibility
      const initialCaption = node.textContent || '';
      if (!initialCaption.trim()) {
        captionWrapper.style.display = 'none';
      }

      // Show toolbar on image click
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toolbar.style.display = toolbar.style.display === 'flex' ? 'none' : 'flex';
      });

      // Hide toolbar when clicking outside
      const handleOutsideClick = (e: MouseEvent) => {
        if (!container.contains(e.target as Node)) {
          toolbar.style.display = 'none';
        }
      };
      document.addEventListener('click', handleOutsideClick);

      // Caption button click - show caption input
      captionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        captionWrapper.style.display = 'block';
        captionWrapper.focus();
        toolbar.style.display = 'none';
      });

      // Delete button click
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode) {
              editor.commands.command(({ tr }) => {
                tr.delete(pos, pos + currentNode.nodeSize);
                return true;
              });
            }
          }
        }
      });

      // Update caption when edited
      captionWrapper.addEventListener('input', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...currentNode.attrs,
                  caption: captionWrapper.textContent || '',
                });
                return true;
              });
            }
          }
        }
      });

      // Hide caption when empty and blur
      captionWrapper.addEventListener('blur', () => {
        updateCaptionVisibility();
      });

      // Show caption on focus
      captionWrapper.addEventListener('focus', () => {
        captionWrapper.style.display = 'block';
      });

      imgWrapper.appendChild(img);
      imgWrapper.appendChild(toolbar);
      container.appendChild(imgWrapper);
      container.appendChild(captionWrapper);

      return {
        dom: container,
        contentDOM: captionWrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }
          img.src = updatedNode.attrs.src;
          if (updatedNode.attrs.alt) img.alt = updatedNode.attrs.alt;
          if (updatedNode.attrs.title) img.title = updatedNode.attrs.title;

          // Update caption visibility
          const hasContent = updatedNode.textContent?.trim() !== '';
          if (!hasContent && !captionWrapper.matches(':focus')) {
            captionWrapper.style.display = 'none';
          }

          return true;
        },
        destroy: () => {
          document.removeEventListener('click', handleOutsideClick);
        },
      };
    };
  },
});
