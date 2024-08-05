import React from 'react';
import type { JSONContent } from '@tiptap/core';
import '@/styles/editor.css';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node } from '@/types/nodes';
import {
  ParagraphCommand,
  BlockquoteCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  BulletListCommand,
  CodeBlockCommand,
  OrderedListCommand,
  DividerCommand,
  TodoCommand,
} from '@/editor/commands';
import {
  IdExtension,
  DocumentNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
  BlockquoteNode,
  BulletListNode,
  CodeBlockNode,
  TabKeymapExtension,
  ListItemNode,
  ListKeymapExtension,
  OrderedListNode,
  PlaceholderExtension,
  TaskListNode,
  TaskItemNode,
  CommanderExtension,
  DividerNode,
  TrailingNode,
  BoldMark,
  ItalicMark,
  UnderlineMark,
  StrikethroughMark,
  CodeMark,
  ColorMark,
  HighlightMark,
  LinkMark,
  DeleteControlExtension,
  DropcursorExtension,
} from '@/editor/extensions';

import { EditorBubbleMenu } from '@/editor/menu/bubble-menu';
import { observer } from 'mobx-react-lite';

interface PageEditorProps {
  node: Node;
}

export const PageEditor = observer(({ node }: PageEditorProps) => {
  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        TextNode,
        ParagraphNode,
        HeadingNode,
        BlockquoteNode,
        BulletListNode,
        CodeBlockNode,
        TabKeymapExtension,
        ListItemNode,
        ListKeymapExtension,
        OrderedListNode,
        PlaceholderExtension.configure({
          message: "Write something or '/' for commands",
        }),
        TaskListNode,
        TaskItemNode,
        DividerNode,
        TrailingNode,
        LinkMark,
        DeleteControlExtension,
        DropcursorExtension,
        CommanderExtension.configure({
          commands: [
            ParagraphCommand,
            BlockquoteCommand,
            Heading1Command,
            Heading2Command,
            Heading3Command,
            BulletListCommand,
            CodeBlockCommand,
            OrderedListCommand,
            DividerCommand,
            TodoCommand,
          ],
          context: {},
        }),
        BoldMark,
        ItalicMark,
        UnderlineMark,
        StrikethroughMark,
        CodeMark,
        ColorMark,
        HighlightMark,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
          spellCheck: 'false',
        },
      },
      shouldRerenderOnTransaction: false,
      onUpdate: ({ editor }) => {
        console.log(editor.getJSON());
      },
      autofocus: 'start',
    },
    [node.id],
  );

  return (
    <div className="min-h-[500px]">
      {editor && (
        <React.Fragment>
          <EditorBubbleMenu editor={editor} />
        </React.Fragment>
      )}
      <EditorContent editor={editor} />
    </div>
  );
});
