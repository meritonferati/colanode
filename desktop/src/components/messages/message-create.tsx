import React from 'react';
import { MessageEditor } from '@/components/messages/message-editor';
import { observer } from 'mobx-react-lite';
import { JSONContent } from '@tiptap/core';

interface MessageCreateProps {
  nodeId: string;
  onSubmit: (content: JSONContent) => void;
}

export const MessageCreate = observer(
  ({ nodeId, onSubmit }: MessageCreateProps) => {
    return (
      <div className="mt-1 px-10">
        <div className="flex flex-col">
          <MessageEditor
            nodeId={nodeId}
            onSubmit={onSubmit}
            canEdit={true}
            canSubmit={true}
          />
        </div>
        <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
      </div>
    );
  },
);
