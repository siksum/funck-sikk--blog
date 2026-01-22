import { Node, mergeAttributes } from '@tiptap/core';

export interface PrivateBlockOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    privateBlock: {
      setPrivateBlock: () => ReturnType;
      togglePrivateBlock: () => ReturnType;
      unsetPrivateBlock: () => ReturnType;
    };
  }
}

export const PrivateBlock = Node.create<PrivateBlockOptions>({
  name: 'privateBlock',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-private]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-private': '',
        class: 'private-block my-4 p-4 rounded-lg border-2 border-dashed border-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
      }),
      [
        'div',
        { class: 'flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-2' },
        [
          'svg',
          { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
          ['path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }],
        ],
        '비공개 콘텐츠',
      ],
      ['div', 0],
    ];
  },

  addCommands() {
    return {
      setPrivateBlock:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      togglePrivateBlock:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
      unsetPrivateBlock:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-p': () => this.editor.commands.togglePrivateBlock(),
    };
  },
});

export default PrivateBlock;
