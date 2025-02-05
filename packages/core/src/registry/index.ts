import { z } from 'zod';

import { ChannelAttributes, channelAttributesSchema } from './channel';
import { ChatAttributes, chatAttributesSchema } from './chat';
import { DatabaseAttributes, databaseAttributesSchema } from './database';
import { FolderAttributes, folderAttributesSchema } from './folder';
import { PageAttributes, pageAttributesSchema } from './page';
import { RecordAttributes, recordAttributesSchema } from './record';
import { SpaceAttributes, spaceAttributesSchema } from './space';
import { MessageAttributes, messageAttributesSchema } from './message';
import {
  DatabaseViewAttributes,
  databaseViewAttributesSchema,
} from './database-view';
import { FileAttributes, fileAttributesSchema } from './file';

type NodeBase = {
  id: string;
  parentId: string;
  rootId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ChannelNode = NodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatNode = NodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseNode = NodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type DatabaseViewNode = NodeBase & {
  type: 'database_view';
  attributes: DatabaseViewAttributes;
};

export type FolderNode = NodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type PageNode = NodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordNode = NodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceNode = NodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type MessageNode = NodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type FileNode = NodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type NodeType = NodeAttributes['type'];

export type NodeAttributes =
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FolderAttributes
  | PageAttributes
  | RecordAttributes
  | MessageAttributes
  | FileAttributes
  | DatabaseViewAttributes;

export type Node =
  | SpaceNode
  | DatabaseNode
  | DatabaseViewNode
  | ChannelNode
  | ChatNode
  | FolderNode
  | PageNode
  | RecordNode
  | MessageNode
  | FileNode;

export const nodeAttributesSchema = z.discriminatedUnion('type', [
  channelAttributesSchema,
  chatAttributesSchema,
  databaseAttributesSchema,
  databaseViewAttributesSchema,
  fileAttributesSchema,
  folderAttributesSchema,
  messageAttributesSchema,
  pageAttributesSchema,
  recordAttributesSchema,
  spaceAttributesSchema,
]);
