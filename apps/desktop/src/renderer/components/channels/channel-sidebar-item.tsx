import { InView } from 'react-intersection-observer';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { NotificationBadge } from '@/renderer/components/ui/notification-badge';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useLayout } from '@/renderer/contexts/layout';
import { cn } from '@/shared/lib/utils';
import { LocalChannelNode } from '@/shared/types/nodes';

interface ChannelSidebarItemProps {
  channel: LocalChannelNode;
}

export const ChannelSidebarItem = ({ channel }: ChannelSidebarItemProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const radar = useRadar();

  const isActive = layout.activeTab === channel.id;
  const channelState = radar.getChannelState(
    workspace.accountId,
    workspace.id,
    channel.id
  );
  const unreadCount = channelState.unseenMessagesCount;
  const mentionsCount = channelState.mentionsCount;

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markNodeAsSeen(workspace.accountId, workspace.id, channel.id);
        }
      }}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={channel.id}
        avatar={channel.attributes.avatar}
        name={channel.attributes.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          !isActive && unreadCount > 0 && 'font-semibold'
        )}
      >
        {channel.attributes.name ?? 'Unnamed'}
      </span>
      {!isActive && (
        <NotificationBadge count={mentionsCount} unseen={unreadCount > 0} />
      )}
    </InView>
  );
};
