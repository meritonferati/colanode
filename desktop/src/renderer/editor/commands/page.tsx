import { EditorCommand } from '@/types/editor';
import { NodeTypes } from '@/lib/constants';
import { FileText } from 'lucide-react';

export const PageCommand: EditorCommand = {
  key: 'page',
  name: 'Page',
  description: 'Insert a nested page',
  keywords: ['page'],
  icon: FileText,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.neuron.executeMutation({
      type: 'page_create',
      name: 'Untitled',
      userId,
      parentId: documentId,
      generateIndex: false,
    });

    if (!output.id) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: NodeTypes.Page,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
