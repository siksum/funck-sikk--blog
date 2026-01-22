import { Node, mergeAttributes } from '@tiptap/core';

export interface MermaidOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaid: (attributes: { chart: string }) => ReturnType;
    };
  }
}

export const MermaidBlock = Node.create<MermaidOptions>({
  name: 'mermaid',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      chart: {
        default: 'graph TD\n  A[Start] --> B[End]',
        parseHTML: (element) => element.getAttribute('data-chart') || '',
        renderHTML: (attributes) => ({
          'data-chart': attributes.chart,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-mermaid]',
        getAttrs: (node) => ({
          chart: (node as HTMLElement).getAttribute('data-chart') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-mermaid': '',
        'data-chart': node.attrs.chart,
        class: 'mermaid-wrapper my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg',
      }),
      [
        'div',
        { class: 'text-center' },
        [
          'div',
          { class: 'flex items-center justify-center gap-2 text-sm text-gray-500 mb-2' },
          [
            'svg',
            { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            ['path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' }],
          ],
          'Mermaid 다이어그램',
        ],
        [
          'pre',
          { class: 'text-xs text-left bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-x-auto' },
          node.attrs.chart,
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setMermaid:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

export default MermaidBlock;
