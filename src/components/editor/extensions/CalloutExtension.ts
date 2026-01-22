import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

export interface CalloutOptions {
  types: string[];
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes: { type: string }) => ReturnType;
      toggleCallout: (attributes: { type: string }) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      types: ['info', 'warning', 'tip', 'danger', 'note'],
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type') || 'info',
        renderHTML: (attributes) => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
        getAttrs: (node) => ({
          type: (node as HTMLElement).getAttribute('data-type') || 'info',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type || 'info';
    const typeStyles: Record<string, string> = {
      info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
      warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20',
      tip: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
      danger: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
      note: 'border-l-violet-500 bg-violet-50 dark:bg-violet-900/20',
    };

    const icons: Record<string, string> = {
      info: 'i',
      warning: '!',
      tip: '*',
      danger: '!!',
      note: '#',
    };

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': '',
        'data-type': type,
        class: `callout callout-${type} my-4 p-4 rounded-r-lg border-l-4 ${typeStyles[type] || typeStyles.info}`,
      }),
      [
        'div',
        { class: 'flex items-start gap-3' },
        [
          'span',
          { class: 'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-current text-white' },
          icons[type] || 'i',
        ],
        ['div', { class: 'flex-1 min-w-0' }, 0],
      ],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
      toggleCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, attributes);
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.toggleCallout({ type: 'info' }),
    };
  },
});

export default Callout;
