import { FileType } from './files';
import { MessageContent, MessageType } from './messages';
import {
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalUpdateTransaction,
} from './sync';

export type SyncMutationsInput = {
  mutations: Mutation[];
};

export type SyncMutationsOutput = {
  results: SyncMutationResult[];
};

export type SyncMutationStatus = 'success' | 'error';

export type SyncMutationResult = {
  id: string;
  status: SyncMutationStatus;
};

export type MutationBase = {
  id: string;
  createdAt: string;
};

export type CreateFileMutationData = {
  id: string;
  type: FileType;
  parentId: string;
  entryId: string;
  rootId: string;
  name: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type CreateFileMutation = MutationBase & {
  type: 'create_file';
  data: CreateFileMutationData;
};

export type ApplyCreateTransactionMutation = MutationBase & {
  type: 'apply_create_transaction';
  data: LocalCreateTransaction;
};

export type ApplyUpdateTransactionMutation = MutationBase & {
  type: 'apply_update_transaction';
  data: LocalUpdateTransaction;
};

export type ApplyDeleteTransactionMutation = MutationBase & {
  type: 'apply_delete_transaction';
  data: LocalDeleteTransaction;
};

export type CreateMessageMutationData = {
  id: string;
  type: MessageType;
  entryId: string;
  parentId: string;
  content: MessageContent;
  rootId: string;
  createdAt: string;
};

export type CreateMessageMutation = MutationBase & {
  type: 'create_message';
  data: CreateMessageMutationData;
};

export type CreateMessageReactionMutationData = {
  messageId: string;
  reaction: string;
  rootId: string;
  createdAt: string;
};

export type CreateMessageReactionMutation = MutationBase & {
  type: 'create_message_reaction';
  data: CreateMessageReactionMutationData;
};

export type MarkMessageSeenMutationData = {
  messageId: string;
  collaboratorId: string;
  seenAt: string;
};

export type MarkMessageSeenMutation = MutationBase & {
  type: 'mark_message_seen';
  data: MarkMessageSeenMutationData;
};

export type DeleteMessageReactionMutationData = {
  messageId: string;
  reaction: string;
  rootId: string;
  deletedAt: string;
};

export type DeleteMessageReactionMutation = MutationBase & {
  type: 'delete_message_reaction';
  data: DeleteMessageReactionMutationData;
};

export type MarkFileSeenMutationData = {
  fileId: string;
  collaboratorId: string;
  seenAt: string;
};

export type MarkFileSeenMutation = MutationBase & {
  type: 'mark_file_seen';
  data: MarkFileSeenMutationData;
};

export type MarkFileOpenedMutationData = {
  fileId: string;
  collaboratorId: string;
  openedAt: string;
};

export type MarkFileOpenedMutation = MutationBase & {
  type: 'mark_file_opened';
  data: MarkFileOpenedMutationData;
};

export type MarkEntrySeenMutationData = {
  entryId: string;
  collaboratorId: string;
  seenAt: string;
};

export type MarkEntrySeenMutation = MutationBase & {
  type: 'mark_entry_seen';
  data: MarkEntrySeenMutationData;
};

export type MarkEntryOpenedMutationData = {
  entryId: string;
  collaboratorId: string;
  openedAt: string;
};

export type MarkEntryOpenedMutation = MutationBase & {
  type: 'mark_entry_opened';
  data: MarkEntryOpenedMutationData;
};

export type Mutation =
  | CreateFileMutation
  | ApplyCreateTransactionMutation
  | ApplyUpdateTransactionMutation
  | ApplyDeleteTransactionMutation
  | CreateMessageMutation
  | CreateMessageReactionMutation
  | DeleteMessageReactionMutation
  | MarkMessageSeenMutation
  | MarkFileSeenMutation
  | MarkFileOpenedMutation
  | MarkEntrySeenMutation
  | MarkEntryOpenedMutation;

export type MutationType = Mutation['type'];
