import { SpaceEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface SpaceContainerTabProps {
  spaceId: string;
}

export const SpaceContainerTab = ({ spaceId }: SpaceContainerTabProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'entry_get',
    entryId: spaceId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const space = data as SpaceEntry;
  if (!space) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    space.attributes.name && space.attributes.name.length > 0
      ? space.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={space.id}
        name={name}
        avatar={space.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
