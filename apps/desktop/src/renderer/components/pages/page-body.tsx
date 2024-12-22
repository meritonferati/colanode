import { useCallback, useEffect } from 'react';
import { hasEditorAccess, NodeRole, PageNode } from '@colanode/core';
import { JSONContent } from '@tiptap/core';

import { Document } from '@/renderer/components/documents/document';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { useRadar } from '@/renderer/contexts/radar';

interface PageBodyProps {
  page: PageNode;
  role: NodeRole;
}

export const PageBody = ({ page, role }: PageBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();
  const { mutate } = useMutation();
  const canEdit = hasEditorAccess(role);

  const handleUpdate = useCallback(
    (content: JSONContent) => {
      mutate({
        input: {
          type: 'page_content_update',
          userId: workspace.userId,
          pageId: page.id,
          content,
        },
        onError(error) {
          toast({
            title: 'Failed to update page',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    },
    [mutate, workspace.userId, page.id]
  );

  useEffect(() => {
    radar.markAsOpened(
      workspace.userId,
      page.id,
      page.type,
      page.transactionId
    );

    const interval = setInterval(() => {
      radar.markAsOpened(
        workspace.userId,
        page.id,
        page.type,
        page.transactionId
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [page.id, page.type, page.transactionId]);

  return (
    <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
      <Document
        nodeId={page.id}
        rootId={page.rootId}
        content={page.attributes.content}
        transactionId={page.transactionId}
        canEdit={canEdit}
        onUpdate={handleUpdate}
        autoFocus="start"
      />
    </ScrollArea>
  );
};
