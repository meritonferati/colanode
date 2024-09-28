import React from 'react';
import { Separator } from '@/components/ui/separator';
import { NodeCollaborator } from '@/components/collaborators/node-collaborator';
import { NodeCollaboratorCreate } from '@/components/collaborators/node-collaborator-create';
import { useNodeCollaboratorsQuery } from '@/queries/use-node-collaborators-query';

interface NodeCollaboratorsProps {
  id: string;
}

export const NodeCollaborators = ({ id }: NodeCollaboratorsProps) => {
  const { data, isPending } = useNodeCollaboratorsQuery(id);

  if (isPending) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <NodeCollaboratorCreate
        id={id}
        existingCollaborators={data.direct.map(
          (collaborator) => collaborator.id,
        )}
      />
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Direct access</h4>
        <div className="flex flex-col gap-3">
          {data.direct && data.direct.length > 0 ? (
            <React.Fragment>
              {data.direct.map((collaborator) => (
                <NodeCollaborator
                  key={collaborator.id}
                  nodeId={id}
                  collaborator={collaborator}
                  removable={true}
                />
              ))}
            </React.Fragment>
          ) : (
            <span className="text-xs text-muted-foreground">
              No direct access.
            </span>
          )}
        </div>
      </div>
      {data.inherit?.map((inheritGroup) => (
        <div key={inheritGroup.id}>
          <Separator className="my-3" />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Inherit from {inheritGroup.name}
            </h4>
            <div className="flex flex-col gap-3">
              {inheritGroup.collaborators?.map((collaborator) => (
                <NodeCollaborator
                  key={collaborator.id}
                  nodeId={id}
                  collaborator={collaborator}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
