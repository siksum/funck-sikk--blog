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

  renderHTML({ HTMLAttributes }) {
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

      const img = document.createElement('img');
      img.src = node.attrs.src;
      if (node.attrs.alt) img.alt = node.attrs.alt;
      if (node.attrs.title) img.title = node.attrs.title;
      img.classList.add('rounded-lg', 'max-w-full', 'h-auto');

      const captionWrapper = document.createElement('figcaption');
      captionWrapper.classList.add('image-caption');
      captionWrapper.contentEditable = 'true';
      captionWrapper.setAttribute('data-placeholder', '캡션을 입력하세요...');

      // Update caption when edited
      captionWrapper.addEventListener('input', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                caption: captionWrapper.textContent || '',
              });
              return true;
            });
          }
        }
      });

      container.appendChild(img);
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
          return true;
        },
      };
    };
  },
});
