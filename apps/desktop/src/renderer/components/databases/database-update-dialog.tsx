import { DatabaseEntry, hasEditorAccess, EntryRole } from '@colanode/core';

import { DatabaseForm } from '@/renderer/components/databases/database-form';
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

interface DatabaseUpdateDialogProps {
  database: DatabaseEntry;
  role: EntryRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DatabaseUpdateDialog = ({
  database,
  role,
  open,
  onOpenChange,
}: DatabaseUpdateDialogProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = hasEditorAccess(role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update database</DialogTitle>
          <DialogDescription>
            Update the database name and icon
          </DialogDescription>
        </DialogHeader>
        <DatabaseForm
          id={database.id}
          values={{
            name: database.attributes.name,
            avatar: database.attributes.avatar,
          }}
          isPending={isPending}
          submitText="Update"
          readOnly={!canEdit}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'database_update',
                databaseId: database.id,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast({
                  title: 'Database updated',
                  description: 'Database was updated successfully',
                  variant: 'default',
                });
              },
              onError(error) {
                toast({
                  title: 'Failed to update database',
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
