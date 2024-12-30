import { extractEntryRole, FolderEntry } from '@colanode/core';

import { FolderBody } from '@/renderer/components/folders/folder-body';
import { FolderHeader } from '@/renderer/components/folders/folder-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FolderContainerProps {
  folderId: string;
}

export const FolderContainer = ({ folderId }: FolderContainerProps) => {
  const workspace = useWorkspace();

  const { data: entry, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: folderId,
    userId: workspace.userId,
  });

  const folder = entry as FolderEntry;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: folder?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!folder?.rootId,
    }
  );

  if (isPendingEntry || isPendingRoot) {
    return null;
  }

  if (!folder || !root) {
    return null;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FolderHeader folder={folder} role={role} />
      <FolderBody folder={folder} role={role} />
    </div>
  );
};
