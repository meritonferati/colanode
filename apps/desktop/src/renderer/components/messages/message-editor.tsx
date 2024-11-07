import React from 'react';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import isHotkey from 'is-hotkey';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Spinner } from '@/renderer/components/ui/spinner';
import {
  MessageNode,
  TextNode,
  ParagraphNode,
  CodeBlockNode,
  TabKeymapExtension,
  PlaceholderExtension,
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
  IdExtension,
  DropcursorExtension,
  FilePlaceholderNode,
  FileNode,
} from '@/renderer/editor/extensions';
import { EditorBubbleMenu } from '@/renderer/editor/menu/bubble-menu';
import { Plus, Search, Send, Upload } from 'lucide-react';
import { toast } from '@/renderer/hooks/use-toast';

interface MessageEditorProps {
  conversationId: string;
  canSubmit?: boolean;
  canEdit?: boolean;
  loading?: boolean;
  onChange?: (content: JSONContent) => void;
  onSubmit: (content: JSONContent) => void;
}

export interface MessageEditorRefProps {
  focus: () => void;
  clear: () => void;
}

export const MessageEditor = React.forwardRef<
  MessageEditorRefProps,
  MessageEditorProps
>((props, ref) => {
  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        MessageNode,
        TextNode,
        ParagraphNode,
        CodeBlockNode,
        TabKeymapExtension,
        PlaceholderExtension.configure({
          message: 'Write a message',
        }),
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
        DropcursorExtension,
        FilePlaceholderNode,
        FileNode,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
        },
        handleKeyDown: (_, event) => {
          return isHotkey('enter', event);
        },
      },
      onUpdate: (e) => {
        props.onChange?.(e.editor.getJSON());
      },
      autofocus: 'end',
      editable: props.canEdit,
    },
    [props.conversationId]
  );

  const handleSubmit = React.useCallback(() => {
    if (editor == null) {
      return;
    }

    props.onSubmit(editor.getJSON());
    editor.chain().clearContent(true).focus().run();
  }, [editor, props]);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (editor == null) {
        return;
      }

      editor.chain().focus('end').run();
      editor?.view?.focus();
    },
    clear: () => {
      editor?.chain().clearContent(true).focus().run();
    },
  }));

  const handleUploadClick = React.useCallback(async () => {
    if (editor == null) {
      return;
    }

    const result = await window.neuron.openFileDialog({
      properties: ['openFile'],
      buttonLabel: 'Upload',
      title: 'Upload files to message',
    });

    if (result.canceled) {
      return;
    }

    const filePath = result.filePaths[0];
    const fileMetadata = await window.neuron.getFileMetadata(filePath);

    if (fileMetadata === null) {
      toast({
        title: 'Failed to add file',
        description:
          'Something went wrong adding file to the message. Please try again!',
        variant: 'destructive',
      });

      return;
    }

    editor.chain().focus().addFilePlaceholder(fileMetadata).run();
  }, [editor]);

  return (
    <div className="flex min-h-0 flex-row items-center rounded bg-gray-100 p-2 pl-0">
      <div className="flex w-10 items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger disabled={!props.canEdit}>
            <span>
              <Plus size={20} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled={true}>
              <div className="flex flex-row items-center gap-2 text-sm">
                <Search className="size-4" />
                <span>Browse</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUploadClick}>
              <div className="flex cursor-pointer flex-row items-center gap-2 text-sm">
                <Upload className="size-4" />
                <span>Upload</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="max-h-72 flex-grow overflow-y-auto">
        {editor && <EditorBubbleMenu editor={editor} />}
        <EditorContent
          editor={editor}
          onKeyDown={(event) => {
            if (editor == null) {
              return false;
            }

            if (isHotkey('enter', event)) {
              if (editor.storage?.mention?.isOpen) {
                return false;
              }

              event.preventDefault();
              event.stopPropagation();
              handleSubmit();
              return true;
            }

            return false;
          }}
        />
      </div>
      <div className="flex flex-row gap-2">
        {props.loading ? (
          <Spinner size={20} />
        ) : (
          <button
            type="submit"
            className={`${
              props.canSubmit
                ? 'cursor-pointer text-blue-600'
                : 'cursor-default text-muted-foreground'
            }`}
            onClick={() => {
              if (editor == null) {
                return;
              }

              handleSubmit();
            }}
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  );
});
