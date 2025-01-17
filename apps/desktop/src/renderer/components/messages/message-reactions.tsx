import { MessageNode } from '@/shared/types/messages';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { cn } from '@/shared/lib/utils';
import { toast } from '@/renderer/hooks/use-toast';
import { useQuery } from '@/renderer/hooks/use-query';

interface MessageReactionsProps {
  message: MessageNode;
}

export const MessageReactions = ({ message }: MessageReactionsProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const { data } = useQuery({
    type: 'message_reactions_get',
    messageId: message.id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const reactionCounts = data ?? [];
  if (reactionCounts.length === 0) {
    return null;
  }

  return (
    <div className="my-1 flex flex-row gap-2">
      {reactionCounts.map((reaction) => {
        if (reaction.count === 0) {
          return null;
        }

        const hasReacted = reaction.reacted;
        return (
          <div
            key={reaction.reaction}
            className={cn(
              'rouded flex flex-row items-center gap-2 px-1 py-0.5 shadow',
              'cursor-pointer text-sm text-muted-foreground hover:text-foreground',
              hasReacted ? 'bg-blue-100' : 'bg-gray-50'
            )}
            onClick={() => {
              if (isPending) {
                return;
              }

              if (
                reactionCounts.some(
                  (reactionCount) =>
                    reactionCount.reaction === reaction.reaction &&
                    reactionCount.reacted
                )
              ) {
                mutate({
                  input: {
                    type: 'message_reaction_delete',
                    messageId: message.id,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                    rootId: message.rootId,
                    reaction: reaction.reaction,
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to remove reaction',
                      description: error.message,
                      variant: 'destructive',
                    });
                  },
                });
              } else {
                mutate({
                  input: {
                    type: 'message_reaction_create',
                    messageId: message.id,
                    accountId: workspace.accountId,
                    workspaceId: workspace.id,
                    rootId: message.rootId,
                    reaction: reaction.reaction,
                  },
                  onError(error) {
                    toast({
                      title: 'Failed to add reaction',
                      description: error.message,
                      variant: 'destructive',
                    });
                  },
                });
              }
            }}
          >
            <EmojiElement id={reaction.reaction} className="size-5" />
            <span>{reaction.count}</span>
          </div>
        );
      })}
    </div>
  );
};
