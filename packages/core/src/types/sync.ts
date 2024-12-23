import { InteractionAttributes } from './interactions';
import { WorkspaceRole } from './workspaces';
import { FileStatus, FileType } from './files';
import { MessageContent, MessageType } from './messages';

import { NodeRole } from '../registry/core';

export type LocalTransaction =
  | LocalCreateTransaction
  | LocalUpdateTransaction
  | LocalDeleteTransaction;

export type LocalCreateTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteTransaction = {
  id: string;
  nodeId: string;
  rootId: string;
  operation: 'delete';
  createdAt: string;
  createdBy: string;
};

export type ServerCreateTransaction = {
  id: string;
  operation: 'create';
  nodeId: string;
  rootId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerUpdateTransaction = {
  id: string;
  operation: 'update';
  nodeId: string;
  rootId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerDeleteTransaction = {
  id: string;
  operation: 'delete';
  nodeId: string;
  rootId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type ServerTransaction =
  | ServerCreateTransaction
  | ServerUpdateTransaction
  | ServerDeleteTransaction;

export type ServerDeletedCollaboration = {
  userId: string;
  nodeId: string;
  workspaceId: string;
  createdAt: string;
  version: string;
};

export type ServerCollaboration = {
  collaboratorId: string;
  nodeId: string;
  rootId: string;
  workspaceId: string;
  role: NodeRole;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: bigint;
};

export type ServerInteraction = {
  userId: string;
  nodeId: string;
  workspaceId: string;
  attributes: InteractionAttributes;
  createdAt: string;
  updatedAt: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  version: string;
};

export type ServerUser = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: WorkspaceRole;
  customName: string | null;
  customAvatar: string | null;
  createdAt: string;
  updatedAt: string | null;
  version: string;
};

export type ServerFile = {
  id: string;
  type: FileType;
  parentId: string;
  rootId: string;
  workspaceId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  status: FileStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: string;
};

export type ServerMessage = {
  id: string;
  type: MessageType;
  parentId: string;
  nodeId: string;
  rootId: string;
  workspaceId: string;
  content: MessageContent;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: string;
};

export type ServerMessageReaction = {
  messageId: string;
  collaboratorId: string;
  reaction: string;
  rootId: string;
  workspaceId: string;
  createdAt: string;
  deletedAt: string | null;
  version: string;
};
