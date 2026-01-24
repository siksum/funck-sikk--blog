import { Node, mergeAttributes } from '@tiptap/core';

export interface DetailsOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    details: {
      setDetails: (options?: { title?: string }) => ReturnType;
      toggleDetailsOpen: () => ReturnType;
    };
  }
}

export const Details = Node.create<DetailsOptions>({
  name: 'details',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: () => false, // Always start collapsed
        renderHTML: (attributes) => {
          if (!attributes.open) {
            return {};
          }
          return { open: 'open' };
        },
      },
      title: {
        default: '접기/펼치기',
        parseHTML: (element) => {
          const summary = element.querySelector('summary');
          return summary?.textContent || '접기/펼치기';
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'details-block' }),
      ['summary', { class: 'details-summary' }, node.attrs.title || '접기/펼치기'],
      ['div', { class: 'details-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setDetails:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { open: false, title: options?.title || '클릭하여 펼치기' },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '내용을 입력하세요...' }],
              },
            ],
          });
        },
      toggleDetailsOpen:
        () =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          if (node?.type.name === 'details') {
            return commands.updateAttributes('details', { open: !node.attrs.open });
          }
          return false;
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const container = document.createElement('details');
      container.classList.add('details-block');
      if (node.attrs.open) {
        container.setAttribute('open', 'open');
      }

      const summary = document.createElement('summary');
      summary.classList.add('details-summary');
      summary.textContent = node.attrs.title || '접기/펼치기';
      summary.setAttribute('contenteditable', 'false');

      // Allow editing summary on double-click
      summary.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newTitle = prompt('제목 입력:', node.attrs.title || '');
        if (newTitle !== null && typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                title: newTitle,
              });
              return true;
            });
            summary.textContent = newTitle;
          }
        }
      });

      // Toggle open attribute when summary is clicked
      summary.addEventListener('click', (e) => {
        // Allow default toggle behavior
        setTimeout(() => {
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (pos !== undefined) {
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  open: container.open,
                });
                return true;
              });
            }
          }
        }, 0);
      });

      const content = document.createElement('div');
      content.classList.add('details-content');

      container.appendChild(summary);
      container.appendChild(content);

      return {
        dom: container,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }
          if (updatedNode.attrs.open) {
            container.setAttribute('open', 'open');
          } else {
            container.removeAttribute('open');
          }
          summary.textContent = updatedNode.attrs.title || '접기/펼치기';
          return true;
        },
      };
    };
  },
});
