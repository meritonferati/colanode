import { generateId, IdType } from '@colanode/core';

import { PageForm } from '@/renderer/components/pages/page-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface PageCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PageCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
}: PageCreateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create page</DialogTitle>
          <DialogDescription>
            Create a new page to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        <PageForm
          id={generateId(IdType.Page)}
          values={{
            name: '',
          }}
          isPending={isPending}
          submitText="Create"
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'page_create',
                parentId: spaceId,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
                generateIndex: true,
              },
              onSuccess(output) {
                onOpenChange(false);
                workspace.openInMain(output.id);
              },
              onError(error) {
                toast({
                  title: 'Failed to create page',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
