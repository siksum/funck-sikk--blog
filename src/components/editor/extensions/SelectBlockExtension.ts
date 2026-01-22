import { Extension } from '@tiptap/core';
import { TextSelection, AllSelection } from '@tiptap/pm/state';

export const SelectBlock = Extension.create({
  name: 'selectBlock',

  addKeyboardShortcuts() {
    return {
      'Mod-a': ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;

        // Find the current block node
        const $from = selection.$from;
        const blockStart = $from.start($from.depth);
        const blockEnd = $from.end($from.depth);

        // Check if current block is already fully selected
        const isBlockSelected =
          selection.from === blockStart && selection.to === blockEnd;

        // Check if entire document is selected
        const isAllSelected = selection instanceof AllSelection;

        if (isAllSelected) {
          // Already all selected, do nothing (or could cycle back to block)
          return true;
        }

        if (isBlockSelected) {
          // Block is selected, select all
          editor.commands.selectAll();
          return true;
        }

        // Select current block
        const tr = state.tr.setSelection(
          TextSelection.create(doc, blockStart, blockEnd)
        );
        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});

export default SelectBlock;
