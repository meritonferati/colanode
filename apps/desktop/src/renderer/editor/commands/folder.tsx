import { EditorCommand } from '@/shared/types/editor';
import { NodeTypes } from '@colanode/core';
import { Folder } from 'lucide-react';

export const FolderCommand: EditorCommand = {
  key: 'folder',
  name: 'Folder',
  description: 'Insert a nested folder',
  keywords: ['folder'],
  icon: Folder,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.colanode.executeMutation({
      type: 'folder_create',
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
        type: NodeTypes.Folder,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
