import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { ChatHeader } from '@/renderer/components/chats/chat-header';
import { ChatBody } from '@/renderer/components/chats/chat-body';
import { extractNodeRole } from '@colanode/core';

interface ChatContainerProps {
  nodeId: string;
}

export const ChatContainer = ({ nodeId }: ChatContainerProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'node_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const node = data;
  if (!node || node.type !== 'chat') {
    return null;
  }

  const role = extractNodeRole([node], workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader chat={node} />
      <ChatBody chat={node} role={role} />
    </div>
  );
};
