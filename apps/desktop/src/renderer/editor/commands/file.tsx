import { EditorCommand } from '@/types/editor';
import { NodeTypes } from '@colanode/core';
import { FilePlus } from 'lucide-react';

export const FileCommand: EditorCommand = {
  key: 'file',
  name: 'File',
  description: 'Insert a nested file',
  keywords: ['file', 'image', 'video', 'audio'],
  icon: FilePlus,
  disabled: false,
  async handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    const result = await window.neuron.openFileDialog({
      properties: ['openFile'],
      buttonLabel: 'Upload',
      title: 'Upload files to page',
    });

    if (result.canceled) {
      return;
    }

    const { userId, documentId } = context;
    const output = await window.neuron.executeMutation({
      type: 'file_create',
      filePath: result.filePaths[0],
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
        type: NodeTypes.File,
        attrs: {
          id: output.id,
        },
      })
      .run();
  },
};
