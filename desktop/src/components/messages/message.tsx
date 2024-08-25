import React from 'react';
import { observer } from 'mobx-react-lite';
import { Avatar } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDate, timeAgo } from '@/lib/utils';
import { InView } from 'react-intersection-observer';
import { MessageReactionPicker } from '@/components/messages/message-reaction-picker';
import { Icon } from '@/components/ui/icon';
import { MessageDeleteButton } from '@/components/messages/message-delete-button';
import { NodeRenderer } from '@/editor/renderers/node';
import { MessageNode } from '@/types/messages';

interface MessageProps {
  message: MessageNode;
  previousMessage?: MessageNode;
}

export const Message = observer(
  ({ message, previousMessage }: MessageProps) => {
    const author = message.author ?? {
      id: message.createdBy,
      attrs: {
        name: 'Deleted user',
      },
    };

    const shouldDisplayUserInfo = () => {
      if (!previousMessage) {
        return true;
      }

      const previousMessageDate = new Date(previousMessage.createdAt);
      const currentMessageDate = new Date(message.createdAt);

      if (previousMessageDate.getDate() !== currentMessageDate.getDate()) {
        return true;
      }

      return (
        !previousMessage || previousMessage.createdBy !== message.createdBy
      );
    };

    const canEdit = true;
    const canDelete = true;
    const canReplyInThread = true;

    if (!message.children || message.children.length === 0) {
      return null;
    }

    return (
      <div
        id={`message-${message.id}`}
        key={`message-${message.id}`}
        className={`group flex flex-row px-1 hover:bg-gray-50 ${
          shouldDisplayUserInfo() ? 'mt-2 first:mt-0' : ''
        }`}
      >
        <div className="mr-2 w-10 pt-1">
          {shouldDisplayUserInfo() && (
            <Avatar id={author.id} name={author.attrs.name} size="medium" />
          )}
        </div>

        <div className="relative w-full">
          {shouldDisplayUserInfo() && (
            <p className="font-medium">
              {author.attrs.name}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {timeAgo(message.createdAt)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="border border-gray-100 bg-white p-2 text-sm text-muted-foreground shadow-md">
                    {formatDate(message.createdAt)}
                  </span>
                </TooltipContent>
              </Tooltip>
            </p>
          )}

          <InView
            rootMargin="50px"
            onChange={(inView) => {
              // onVisibilityChange?.(data.id, inView);
            }}
          >
            <ul className="invisible absolute -top-2 right-1 z-10 flex flex-row bg-gray-100 text-muted-foreground shadow group-hover:visible">
              {canReplyInThread && (
                <li
                  className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200"
                  onClick={() => {
                    // workspace.openPanel(data.id);
                  }}
                >
                  <Icon
                    name="question-answer-line"
                    className="cursor-pointer"
                  />
                </li>
              )}
              <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
                <MessageReactionPicker
                  onEmojiSelect={(emoji) => {
                    console.log(emoji);
                  }}
                />
              </li>
              <li
                className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200"
                onClick={() => {
                  // onReply?.(data.id, data.createdBy);
                }}
              >
                <Icon name="reply-line" className="cursor-pointer" />
              </li>
              {canDelete && (
                <li className="flex h-8 w-7 cursor-pointer items-center justify-center hover:bg-gray-200">
                  <MessageDeleteButton id={message.id} />
                </li>
              )}
            </ul>
            {/*{data.messageReference && <MessageReference />}*/}
            <div className="text-foreground">
              <NodeRenderer node={message} keyPrefix={message.id} />
            </div>
            {/*<MessageReactions*/}
            {/*  message={message}*/}
            {/*  onReactionClick={handleEmojiSelect}*/}
            {/*/>*/}
            {/*{canReplyInThread && (*/}
            {/*  <MessageThread*/}
            {/*    message={data}*/}
            {/*    onClick={() => workspace.openPanel(data.id)}*/}
            {/*  />*/}
            {/*)}*/}
          </InView>
        </div>
      </div>
    );
  },
);
