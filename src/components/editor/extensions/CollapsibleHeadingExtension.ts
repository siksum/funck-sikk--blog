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
      setCollapsibleHeadingColor: (color: string | null) => ReturnType;
      setCollapsibleHeadingBgColor: (color: string | null) => ReturnType;
      updateCollapsibleHeadingTitle: (title: string) => ReturnType;
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
      textColor: {
        default: null,
        parseHTML: (element) => {
          const heading = element.querySelector('.collapsible-heading-title');
          if (heading) {
            const style = (heading as HTMLElement).style.color;
            return style || null;
          }
          return null;
        },
        renderHTML: () => ({}),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => {
          const summary = element.querySelector('.collapsible-heading-summary');
          if (summary) {
            const style = (summary as HTMLElement).style.backgroundColor;
            return style || null;
          }
          return null;
        },
        renderHTML: () => ({}),
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
    const summaryStyle = node.attrs.backgroundColor
      ? `background-color: ${node.attrs.backgroundColor}; padding: 0.5rem 0.75rem; border-radius: 0.5rem;`
      : '';
    const titleStyle = node.attrs.textColor ? `color: ${node.attrs.textColor};` : '';

    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'collapsible-heading',
        'data-level': level,
      }),
      [
        'summary',
        { class: 'collapsible-heading-summary', style: summaryStyle || undefined },
        [`h${level}`, { class: 'collapsible-heading-title', 'data-level': level, style: titleStyle || undefined }, node.attrs.title || '제목'],
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
      setCollapsibleHeadingColor:
        (color) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          // Find the collapsibleHeading node that contains the selection
          let foundPos: number | null = null;
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'collapsibleHeading' && foundPos === null) {
              foundPos = pos;
              return false;
            }
            return true;
          });
          // Also check parent nodes
          if (foundPos === null) {
            const $pos = state.doc.resolve(selection.from);
            for (let d = $pos.depth; d > 0; d--) {
              const node = $pos.node(d);
              if (node.type.name === 'collapsibleHeading') {
                foundPos = $pos.before(d);
                break;
              }
            }
          }
          if (foundPos !== null) {
            const node = state.doc.nodeAt(foundPos);
            if (node) {
              if (dispatch) {
                tr.setNodeMarkup(foundPos, undefined, {
                  ...node.attrs,
                  textColor: color,
                });
                dispatch(tr);
              }
              return true;
            }
          }
          return false;
        },
      setCollapsibleHeadingBgColor:
        (color) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          // Find the collapsibleHeading node that contains the selection
          let foundPos: number | null = null;
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'collapsibleHeading' && foundPos === null) {
              foundPos = pos;
              return false;
            }
            return true;
          });
          // Also check parent nodes
          if (foundPos === null) {
            const $pos = state.doc.resolve(selection.from);
            for (let d = $pos.depth; d > 0; d--) {
              const node = $pos.node(d);
              if (node.type.name === 'collapsibleHeading') {
                foundPos = $pos.before(d);
                break;
              }
            }
          }
          if (foundPos !== null) {
            const node = state.doc.nodeAt(foundPos);
            if (node) {
              if (dispatch) {
                tr.setNodeMarkup(foundPos, undefined, {
                  ...node.attrs,
                  backgroundColor: color,
                });
                dispatch(tr);
              }
              return true;
            }
          }
          return false;
        },
      updateCollapsibleHeadingTitle:
        (title) =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          // Find the collapsibleHeading node that contains the selection
          let foundPos: number | null = null;
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (node.type.name === 'collapsibleHeading' && foundPos === null) {
              foundPos = pos;
              return false;
            }
            return true;
          });
          // Also check parent nodes
          if (foundPos === null) {
            const $pos = state.doc.resolve(selection.from);
            for (let d = $pos.depth; d > 0; d--) {
              const node = $pos.node(d);
              if (node.type.name === 'collapsibleHeading') {
                foundPos = $pos.before(d);
                break;
              }
            }
          }
          if (foundPos !== null) {
            const node = state.doc.nodeAt(foundPos);
            if (node) {
              if (dispatch) {
                tr.setNodeMarkup(foundPos, undefined, {
                  ...node.attrs,
                  title: title,
                });
                dispatch(tr);
              }
              return true;
            }
          }
          return false;
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const level = node.attrs.level || 2;

      // Use div instead of details to avoid native marker
      const container = document.createElement('div');
      container.classList.add('collapsible-heading');
      container.setAttribute('data-level', String(level));
      if (node.attrs.open) {
        container.classList.add('is-open');
      }

      // Use div instead of summary to avoid native marker
      const summaryDiv = document.createElement('div');
      summaryDiv.classList.add('collapsible-heading-summary');

      // Apply background color if set
      if (node.attrs.backgroundColor) {
        summaryDiv.style.backgroundColor = node.attrs.backgroundColor;
        summaryDiv.style.padding = '0.5rem 0.75rem';
        summaryDiv.style.borderRadius = '0.5rem';
      }

      // Create toggle button for the arrow
      const toggleBtn = document.createElement('span');
      toggleBtn.classList.add('collapsible-heading-toggle-btn');
      toggleBtn.textContent = '▶';
      toggleBtn.style.cursor = 'pointer';
      toggleBtn.style.userSelect = 'none';
      toggleBtn.style.fontSize = '0.65em';
      toggleBtn.style.transition = 'transform 0.2s ease';
      toggleBtn.style.display = 'inline-block';
      toggleBtn.style.marginRight = '0.5rem';
      toggleBtn.style.color = '#9ca3af';
      if (node.attrs.open) {
        toggleBtn.style.transform = 'rotate(90deg)';
      }

      // Toggle button click handler
      const handleToggle = () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos !== undefined) {
            const currentNode = editor.state.doc.nodeAt(pos);
            if (currentNode && currentNode.type.name === 'collapsibleHeading') {
              const newOpenState = !currentNode.attrs.open;

              // Toggle DOM state first for immediate feedback
              if (newOpenState) {
                container.classList.add('is-open');
                toggleBtn.style.transform = 'rotate(90deg)';
                content.style.display = 'block';
              } else {
                container.classList.remove('is-open');
                toggleBtn.style.transform = 'rotate(0deg)';
                content.style.display = 'none';
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

      // Helper function to set up heading with all event listeners
      const setupHeading = (h: HTMLHeadingElement) => {
        h.classList.add('collapsible-heading-title');
        h.setAttribute('contenteditable', 'true');
        h.style.outline = 'none';
        h.style.minWidth = '50px';
        h.style.cursor = 'text';

        // Stop propagation but allow default for cursor placement
        h.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });

        h.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        // Handle inline title editing
        h.addEventListener('blur', () => {
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (pos !== undefined) {
              const currentNode = editor.state.doc.nodeAt(pos);
              if (currentNode && currentNode.type.name === 'collapsibleHeading') {
                const newTitle = h.textContent || '제목';
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
        h.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            h.blur();
          }
          // Prevent propagation for all keys while editing
          e.stopPropagation();
        });

        // Prevent paste with formatting
        h.addEventListener('paste', (e) => {
          e.preventDefault();
          const text = e.clipboardData?.getData('text/plain') || '';
          document.execCommand('insertText', false, text);
        });
      };

      let heading = document.createElement(`h${level}`) as HTMLHeadingElement;
      heading.setAttribute('data-level', String(level));
      heading.textContent = node.attrs.title || '제목';

      // Apply text color if set
      if (node.attrs.textColor) {
        heading.style.color = node.attrs.textColor;
      }

      setupHeading(heading);
      summaryDiv.appendChild(toggleBtn);
      summaryDiv.appendChild(heading);

      const content = document.createElement('div');
      content.classList.add('collapsible-heading-content');
      // Set initial visibility based on open state
      content.style.display = node.attrs.open ? 'block' : 'none';

      container.appendChild(summaryDiv);
      container.appendChild(content);

      return {
        dom: container,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }
          if (updatedNode.attrs.open) {
            container.classList.add('is-open');
            toggleBtn.style.transform = 'rotate(90deg)';
            content.style.display = 'block';
          } else {
            container.classList.remove('is-open');
            toggleBtn.style.transform = 'rotate(0deg)';
            content.style.display = 'none';
          }

          // Only update text if it differs (avoid cursor jumping during editing)
          if (document.activeElement !== heading && heading.textContent !== updatedNode.attrs.title) {
            heading.textContent = updatedNode.attrs.title || '제목';
          }

          // Update text color
          if (updatedNode.attrs.textColor) {
            heading.style.color = updatedNode.attrs.textColor;
          } else {
            heading.style.color = '';
          }

          // Update background color
          if (updatedNode.attrs.backgroundColor) {
            summaryDiv.style.backgroundColor = updatedNode.attrs.backgroundColor;
            summaryDiv.style.padding = '0.5rem 0.75rem';
            summaryDiv.style.borderRadius = '0.5rem';
          } else {
            summaryDiv.style.backgroundColor = '';
            summaryDiv.style.padding = '';
            summaryDiv.style.borderRadius = '';
          }

          // Update heading level if changed
          const newLevel = updatedNode.attrs.level || 2;
          if (heading.tagName.toLowerCase() !== `h${newLevel}`) {
            const newHeading = document.createElement(`h${newLevel}`) as HTMLHeadingElement;
            newHeading.setAttribute('data-level', String(newLevel));
            newHeading.textContent = updatedNode.attrs.title || '제목';
            if (updatedNode.attrs.textColor) {
              newHeading.style.color = updatedNode.attrs.textColor;
            }
            setupHeading(newHeading);
            summaryDiv.replaceChild(newHeading, heading);
            heading = newHeading;
          }

          return true;
        },
      };
    };
  },
});
