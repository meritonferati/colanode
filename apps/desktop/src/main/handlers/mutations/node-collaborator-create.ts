import { MutationHandler } from '@/main/types';
import {
  NodeCollaboratorCreateMutationInput,
  NodeCollaboratorCreateMutationOutput,
} from '@/shared/mutations/node-collaborator-create';
import { nodeService } from '@/main/services/node-service';
import { set } from 'lodash-es';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput
  ): Promise<NodeCollaboratorCreateMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      for (const collaboratorId of input.collaboratorIds) {
        set(attributes, `collaborators.${collaboratorId}`, input.role);
      }
      return attributes;
    });

    return {
      success: true,
    };
  }
}
