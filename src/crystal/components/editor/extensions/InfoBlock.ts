import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { InfoNodeView } from '../node-views/InfoNodeView'

export const InfoBlock = Node.create({
  name: 'infoBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: 'info',
      },
      title: {
        default: '',
      },
      content: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="info-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'info-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoNodeView)
  },

  addCommands() {
    return {
      setInfoBlock:
        (attributes: any) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              id: `info-${Date.now()}`,
              type: 'info',
              ...attributes,
            },
          })
        },
    } as any
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        console.log(selection)

        // Check if a selection exists (user selected a range of content)
        if (!selection.empty) {
          // You might still allow deletion if the entire node is selected,
          // or prevent it based on your specific needs.
          // Returning false here allows the default behavior for selections.
          return false;
        }

        // Check if the cursor is at the very beginning of the document
        // if ($cursor && $cursor.pos === 1) {
        //   // Prevent the default backspace behavior at the start of the editor
        //   // to avoid deleting the very first element (e.g., a locked title block).
        //   console.log('Backspace blocked at the start of the editor.');
        //   return true; // Event handled, stop default propagation
        // }

        // Example: Check if the node before the cursor is a specific "locked" type
        // const resolvedPos = editor.state.doc.resolve($cursor.pos);
        // const nodeBefore = resolvedPos.nodeBefore;

        // if (nodeBefore && nodeBefore.type.name === 'lockedElement') {
        //   // Prevent backspace from deleting this specific node type
        //   console.log('Attempted to delete a locked element, action blocked.');
        //   return true; // Event handled, default backspace is avoided
        // }

        // For all other cases, return false to let the default backspace logic proceed
        return false;
      },
    };
  },
})
