import React from 'react';
import { defaultClasses } from '@/renderer/editor/classes';
import { NodeChildrenRenderer } from '@/renderer/editor/renderers/node-children';
import { JSONContent } from '@tiptap/core';

interface TaskItemRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const TaskItemRenderer = ({
  node,
  keyPrefix,
}: TaskItemRendererProps) => {
  return (
    <li className={defaultClasses.taskItem}>
      <NodeChildrenRenderer node={node} keyPrefix={keyPrefix} />
    </li>
  );
};
