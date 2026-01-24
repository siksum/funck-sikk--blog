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
        // Don't parse from HTML - always start collapsed
        parseHTML: () => false,
        renderHTML: (attributes) => {
          if (!attributes.open) {
            return {};
          }
          return { open: 'open' };
        },
      },
      title: {
        default: '접기/펼치기',
        // Title is extracted in parseHTML getAttrs, not here
        parseHTML: () => null,
        renderHTML: () => ({}), // Don't render as HTML attribute
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details:not(.collapsible-heading)',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          // Skip if this is a collapsible heading
          if (el.classList.contains('collapsible-heading')) {
            return false;
          }
          const summary = el.querySelector('summary');
          const titleSpan = summary?.querySelector('.details-title-text');
          return {
            open: false, // Always start collapsed
            title: titleSpan?.textContent || summary?.textContent || '접기/펼치기',
          };
        },
        // Custom content element selection - only parse from content div, not summary
        contentElement: (element) => {
          const el = element as HTMLElement;
          // Try to find .details-content first
          const contentDiv = el.querySelector('.details-content');
          if (contentDiv) {
            return contentDiv as HTMLElement;
          }

          // If no .details-content, create a wrapper with all non-summary children
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
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'details-block' }),
      ['summary', { class: 'details-summary' }, ['span', { class: 'details-title-text' }, node.attrs.title || '접기/펼치기']],
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

      // Create toggle button for the arrow
      const toggleBtn = document.createElement('span');
      toggleBtn.classList.add('details-toggle-btn');
      toggleBtn.textContent = '▶';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.userSelect = 'none';
      toggleBtn.style.fontSize = '0.75rem';
      toggleBtn.style.transition = 'transform 0.2s ease';
      toggleBtn.style.display = 'inline-block';
      if (node.attrs.open) {
        toggleBtn.style.transform = 'rotate(90deg)';
      }

      // Toggle button click handler
      const handleToggle = () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === 'details') {
              const newOpenState = !currentNode.attrs.open;

              // Toggle DOM state first for immediate feedback
              if (newOpenState) {
                container.setAttribute('open', 'open');
                toggleBtn.style.transform = 'rotate(90deg)';
              } else {
                container.removeAttribute('open');
                toggleBtn.style.transform = 'rotate(0deg)';
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
      };

      toggleBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      });

      // Create a span for the title text to enable inline editing
      const titleSpan = document.createElement('span');
      titleSpan.classList.add('details-title-text');
      titleSpan.textContent = node.attrs.title || '접기/펼치기';
      titleSpan.setAttribute('contenteditable', 'true');
      titleSpan.style.outline = 'none';
      titleSpan.style.minWidth = '50px';
      titleSpan.style.display = 'inline-block';
      titleSpan.style.cursor = 'text';

      // Stop propagation to prevent summary click handler, but allow default for cursor placement
      titleSpan.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      titleSpan.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Handle inline title editing on blur
      titleSpan.addEventListener('blur', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === 'details') {
              const newTitle = titleSpan.textContent || '접기/펼치기';
              if (newTitle !== currentNode.attrs.title) {
                editor.commands.command(({ tr }) => {
                  tr.setNodeMarkup(pos, undefined, {
                    ...currentNode.attrs,
                    title: newTitle,
                  });
                  return true;
                });
              }
            }
          }
        }
      });

      // Handle Enter key to finish editing
      titleSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleSpan.blur();
        }
        // Prevent propagation for all keys while editing
        e.stopPropagation();
      });

      // Prevent paste with formatting
      titleSpan.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
      });

      summary.appendChild(toggleBtn);
      summary.appendChild(titleSpan);

      // Prevent native details toggle entirely on summary
      summary.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
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
            toggleBtn.style.transform = 'rotate(90deg)';
          } else {
            container.removeAttribute('open');
            toggleBtn.style.transform = 'rotate(0deg)';
          }
          // Only update text if it differs (avoid cursor jumping during editing)
          if (document.activeElement !== titleSpan && titleSpan.textContent !== updatedNode.attrs.title) {
            titleSpan.textContent = updatedNode.attrs.title || '접기/펼치기';
          }
          return true;
        },
      };
    };
  },
});
