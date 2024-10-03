import { NodeCollaboratorsWrapper } from '@/types/nodes';

export type NodeCollaboratorListQueryInput = {
  type: 'node_collaborator_list';
  nodeId: string;
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    node_collaborator_list: {
      input: NodeCollaboratorListQueryInput;
      output: NodeCollaboratorsWrapper;
    };
  }
}
