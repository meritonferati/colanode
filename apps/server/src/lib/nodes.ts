import {
  extractNodeCollaborators,
  extractNodeRole,
  Node,
  NodeOutput,
  NodeRole,
  NodeType,
  ServerCollaboration,
  ServerDeletedCollaboration,
  ServerInteraction,
  ServerTransaction,
  ServerUser,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

import { database } from '@/data/database';
import {
  SelectCollaboration,
  SelectDeletedCollaboration,
  SelectInteraction,
  SelectNode,
  SelectTransaction,
  SelectUser,
} from '@/data/schema';
import { NodeCollaborator } from '@/types/nodes';

export const mapNodeOutput = (node: SelectNode): NodeOutput => {
  return {
    id: node.id,
    parentId: node.parent_id,
    workspaceId: node.workspace_id,
    type: node.type,
    attributes: node.attributes,
    state: '',
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    transactionId: node.transaction_id,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
  };
};

export const mapNode = (node: SelectNode): Node => {
  return {
    id: node.id,
    parentId: node.parent_id,
    type: node.type as NodeType,
    attributes: node.attributes,
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
    transactionId: node.transaction_id,
  } as Node;
};

export const mapTransaction = (
  transaction: SelectTransaction
): ServerTransaction => {
  if (transaction.operation === 'create' && transaction.data) {
    return {
      id: transaction.id,
      operation: 'create',
      nodeId: transaction.node_id,
      rootId: transaction.root_id,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  if (transaction.operation === 'update' && transaction.data) {
    return {
      id: transaction.id,
      operation: 'update',
      nodeId: transaction.node_id,
      rootId: transaction.root_id,
      workspaceId: transaction.workspace_id,
      data: encodeState(transaction.data),
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  if (transaction.operation === 'delete') {
    return {
      id: transaction.id,
      operation: 'delete',
      nodeId: transaction.node_id,
      rootId: transaction.root_id,
      workspaceId: transaction.workspace_id,
      createdAt: transaction.created_at.toISOString(),
      createdBy: transaction.created_by,
      serverCreatedAt: transaction.server_created_at.toISOString(),
      version: transaction.version.toString(),
    };
  }

  throw new Error('Unknown transaction type');
};

export const mapDeletedCollaboration = (
  deletedCollaboration: SelectDeletedCollaboration
): ServerDeletedCollaboration => {
  return {
    userId: deletedCollaboration.user_id,
    nodeId: deletedCollaboration.node_id,
    workspaceId: deletedCollaboration.workspace_id,
    createdAt: deletedCollaboration.created_at.toISOString(),
    version: deletedCollaboration.version.toString(),
  };
};

export const mapCollaboration = (
  collaboration: SelectCollaboration
): ServerCollaboration => {
  return {
    userId: collaboration.user_id,
    nodeId: collaboration.node_id,
    workspaceId: collaboration.workspace_id,
    roles: collaboration.roles,
    createdAt: collaboration.created_at.toISOString(),
    updatedAt: collaboration.updated_at?.toISOString() ?? null,
    version: collaboration.version.toString(),
  };
};

export const mapInteraction = (
  interaction: SelectInteraction
): ServerInteraction => {
  return {
    userId: interaction.user_id,
    nodeId: interaction.node_id,
    workspaceId: interaction.workspace_id,
    attributes: interaction.attributes,
    createdAt: interaction.created_at.toISOString(),
    updatedAt: interaction.updated_at?.toISOString() ?? null,
    serverCreatedAt: interaction.server_created_at.toISOString(),
    serverUpdatedAt: interaction.server_updated_at?.toISOString() ?? null,
    version: interaction.version.toString(),
  };
};

export const mapUser = (user: SelectUser): ServerUser => {
  return {
    id: user.id,
    workspaceId: user.workspace_id,
    email: user.email,
    role: user.role,
    name: user.name,
    avatar: user.avatar,
    customName: user.custom_name,
    customAvatar: user.custom_avatar,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at?.toISOString() ?? null,
    version: user.version.toString(),
  };
};

export const fetchNode = async (nodeId: string): Promise<SelectNode | null> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  return result ?? null;
};

export const fetchNodeAncestors = async (
  nodeId: string
): Promise<SelectNode[]> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
    .where('node_paths.descendant_id', '=', nodeId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchNodeDescendants = async (
  nodeId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', nodeId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const fetchNodeCollaborators = async (
  nodeId: string
): Promise<NodeCollaborator[]> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  const collaboratorsMap = new Map<string, string>();

  for (const ancestor of ancestors) {
    const collaborators = extractNodeCollaborators(ancestor.attributes);
    for (const [collaboratorId, role] of Object.entries(collaborators)) {
      collaboratorsMap.set(collaboratorId, role);
    }
  }

  return Array.from(collaboratorsMap.entries()).map(
    ([collaboratorId, role]) => ({
      nodeId: nodeId,
      collaboratorId: collaboratorId,
      role: role,
    })
  );
};

export const fetchNodeRole = async (
  nodeId: string,
  collaboratorId: string
): Promise<NodeRole | null> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  if (ancestors.length === 0) {
    return null;
  }

  return extractNodeRole(ancestors.map(mapNode), collaboratorId);
};
