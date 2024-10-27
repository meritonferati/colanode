import React from 'react';
import { useDatabase } from '@/renderer/contexts/database';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Plus } from 'lucide-react';

export const TableViewRecordCreateRow = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const { mutate, isPending } = useMutation();

  return (
    <button
      type="button"
      disabled={isPending}
      className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-gray-50"
      onClick={() => {
        mutate({
          input: {
            type: 'record_create',
            databaseId: database.id,
            userId: workspace.userId,
          },
          onSuccess: (output) => {
            workspace.openModal(output.id);
          },
        });
      }}
    >
      <Plus className="size-4" />
      <span className="text-sm">Add record</span>
    </button>
  );
};
