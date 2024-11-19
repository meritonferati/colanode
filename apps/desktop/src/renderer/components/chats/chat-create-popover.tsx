import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Plus } from 'lucide-react';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { UserSearch } from '@/renderer/components/users/user-search';
import { useWorkspace } from '@/renderer/contexts/workspace';

export const ChatCreatePopover = () => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Plus className="mr-2 size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <UserSearch
          onSelect={(user) => {
            if (isPending) return;

            mutate({
              input: {
                type: 'chat_create',
                userId: workspace.userId,
                otherUserId: user.id,
                workspaceId: workspace.id,
              },
              onSuccess(output) {
                workspace.openInMain(output.id);
                setOpen(false);
              },
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
