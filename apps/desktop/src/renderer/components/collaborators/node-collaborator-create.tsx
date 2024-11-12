import React from 'react';
import { NodeCollaboratorSearch } from '@/renderer/components/collaborators/node-collaborator-search';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { NodeCollaboratorRoleDropdown } from '@/renderer/components/collaborators/node-collaborator-role-dropdown';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { UserNode } from '@colanode/core';

interface NodeCollaboratorCreate {
  nodeId: string;
  existingCollaborators: string[];
}

export const NodeCollaboratorCreate = ({
  nodeId,
  existingCollaborators,
}: NodeCollaboratorCreate) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const [users, setUsers] = React.useState<UserNode[]>([]);
  const [role, setRole] = React.useState('collaborator');

  return (
    <div className="flex flex-col gap-2">
      <NodeCollaboratorSearch
        value={users}
        onChange={setUsers}
        excluded={existingCollaborators}
      />
      <div className="flex justify-end space-x-2">
        <NodeCollaboratorRoleDropdown
          value={role}
          onChange={setRole}
          canEdit={true}
        />
        <Button
          variant="default"
          className="shrink-0"
          size="sm"
          disabled={users.length === 0 || isPending}
          onClick={() => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'node_collaborator_create',
                nodeId,
                collaboratorIds: users.map((user) => user.id),
                role: role,
                userId: workspace.userId,
              },
              onSuccess() {
                setUsers([]);
              },
              onError() {
                toast({
                  title: 'Failed to add collaborators',
                  description:
                    'Something went wrong trying to add collaborators. Please try again.',
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          {isPending && <Spinner className="mr-1" />}
          Invite
        </Button>
      </div>
    </div>
  );
};
