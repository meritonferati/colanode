import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useLayout } from '@/renderer/contexts/layout';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { Spinner } from '@/renderer/components/ui/spinner';

interface DatabaseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  databaseId: string;
}

export const DatabaseDeleteDialog = ({
  databaseId,
  open,
  onOpenChange,
}: DatabaseDeleteDialogProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const { mutate, isPending } = useMutation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want delete this database?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This database will no longer be
            accessible by you or others you&apos;ve shared it with.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              mutate({
                input: {
                  type: 'database_delete',
                  databaseId,
                  accountId: workspace.accountId,
                  workspaceId: workspace.id,
                },
                onSuccess() {
                  onOpenChange(false);
                  layout.close(databaseId);
                },
                onError(error) {
                  toast({
                    title: 'Failed to delete database',
                    description: error.message,
                    variant: 'destructive',
                  });
                },
              });
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
