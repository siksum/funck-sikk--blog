import { Node, mergeAttributes } from '@tiptap/core';

export interface CollapsibleHeadingOptions {
  HTMLAttributes: Record<string, unknown>;
  levels: number[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collapsibleHeading: {
      setCollapsibleHeading: (options?: { level?: number; title?: string }) => ReturnType;
      toggleCollapsibleHeadingOpen: () => ReturnType;
    };
  }
}

export const CollapsibleHeading = Node.create<CollapsibleHeadingOptions>({
  name: 'collapsibleHeading',

  addOptions() {
    return {
      HTMLAttributes: {},
      levels: [1, 2, 3, 4, 5],
    };
  },

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      level: {
        default: 2,
        parseHTML: (element) => {
          const heading = element.querySelector('h1, h2, h3, h4, h5, h6, .collapsible-heading-title');
          if (heading) {
            const match = heading.tagName.match(/^H(\d)$/i);
            if (match) return parseInt(match[1]);
            // Check data attribute
            const level = heading.getAttribute('data-level');
            if (level) return parseInt(level);
          }
          return 2;
        },
        renderHTML: (attributes) => ({}),
      },
      open: {
        default: true, // Start expanded by default
        parseHTML: (element) => element.hasAttribute('open'),
        renderHTML: (attributes) => {
          if (!attributes.open) {
            return {};
          }
          return { open: 'open' };
        },
      },
      title: {
        default: '제목',
        parseHTML: (element) => {
          const heading = element.querySelector('h1, h2, h3, h4, h5, h6, .collapsible-heading-title');
          return heading?.textContent || '제목';
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details.collapsible-heading',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const summary = el.querySelector('summary');
          const heading = summary?.querySelector('h1, h2, h3, h4, h5, h6, .collapsible-heading-title');
          let level = 2;
          if (heading) {
            const match = heading.tagName.match(/^H(\d)$/i);
            if (match) level = parseInt(match[1]);
            const dataLevel = heading.getAttribute('data-level');
            if (dataLevel) level = parseInt(dataLevel);
          }
          return {
            open: el.hasAttribute('open'),
            title: heading?.textContent || summary?.textContent || '제목',
            level,
          };
        },
        contentElement: (element) => {
          const el = element as HTMLElement;
          const contentDiv = el.querySelector('.collapsible-heading-content');
          if (contentDiv) {
            return contentDiv as HTMLElement;
          }
          // Fallback: create wrapper with non-summary children
          const wrapper = document.createElement('div');
          const children = Array.from(el.childNodes);
          for (const child of children) {
            if (child.nodeName.toLowerCase() !== 'summary') {
              wrapper.appendChild(child.cloneNode(true));
            }
          }
          return wrapper;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const level = node.attrs.level || 2;
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'collapsible-heading',
        'data-level': level,
      }),
      [
        'summary',
        { class: 'collapsible-heading-summary' },
        [`h${level}`, { class: 'collapsible-heading-title', 'data-level': level }, node.attrs.title || '제목'],
      ],
      ['div', { class: 'collapsible-heading-content' }, 0],
    ];
  },

  addCommands() {
    return {
      setCollapsibleHeading:
        (options) =>
        ({ commands }) => {
          const level = options?.level || 2;
          return commands.insertContent({
            type: this.name,
            attrs: {
              open: true,
              title: options?.title || '클릭하여 접기/펼치기',
              level,
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '내용을 입력하세요...' }],
              },
            ],
          });
        },
      toggleCollapsibleHeadingOpen:
        () =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          if (node?.type.name === 'collapsibleHeading') {
            return commands.updateAttributes('collapsibleHeading', { open: !node.attrs.open });
          }
          return false;
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const level = node.attrs.level || 2;

      const container = document.createElement('details');
      container.classList.add('collapsible-heading');
      container.setAttribute('data-level', String(level));
      if (node.attrs.open) {
        container.setAttribute('open', 'open');
      }

      const summary = document.createElement('summary');
      summary.classList.add('collapsible-heading-summary');

      const heading = document.createElement(`h${level}`);
      heading.classList.add('collapsible-heading-title');
      heading.setAttribute('data-level', String(level));
      heading.textContent = node.attrs.title || '제목';
      heading.setAttribute('contenteditable', 'false');

      summary.appendChild(heading);

      // Allow editing title on double-click
      heading.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === 'collapsibleHeading') {
              const newTitle = prompt('제목 입력:', currentNode.attrs.title || '');
              if (newTitle !== null) {
                editor.commands.command(({ tr }) => {
                  tr.setNodeMarkup(pos, undefined, {
                    ...currentNode.attrs,
                    title: newTitle,
                  });
                  return true;
                });
                heading.textContent = newTitle;
              }
            }
          }
        }
      });

      // Toggle open attribute when summary is clicked
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === 'collapsibleHeading') {
              const newOpenState = !currentNode.attrs.open;

              // Toggle DOM state first for immediate feedback
              if (newOpenState) {
                container.setAttribute('open', 'open');
              } else {
                container.removeAttribute('open');
              }

              // Update editor state
              editor.commands.command(({ tr }) => {
                tr.setNodeMarkup(pos, undefined, {
                  ...currentNode.attrs,
                  open: newOpenState,
                });
                return true;
              });
            }
          }
        }
      });

      const content = document.createElement('div');
      content.classList.add('collapsible-heading-content');

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
          heading.textContent = updatedNode.attrs.title || '제목';

          // Update heading level if changed
          const newLevel = updatedNode.attrs.level || 2;
          if (heading.tagName.toLowerCase() !== `h${newLevel}`) {
            const newHeading = document.createElement(`h${newLevel}`);
            newHeading.classList.add('collapsible-heading-title');
            newHeading.setAttribute('data-level', String(newLevel));
            newHeading.textContent = updatedNode.attrs.title || '제목';
            newHeading.setAttribute('contenteditable', 'false');
            summary.replaceChild(newHeading, heading);
          }

          return true;
        },
      };
    };
  },
});
