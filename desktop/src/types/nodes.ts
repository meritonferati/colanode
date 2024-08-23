export type Node = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index?: string | null;
  attrs?: Record<string, any> | null;
  content?: NodeBlock[] | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt?: string | null;
  serverUpdatedAt?: string | null;
  serverVersionId?: string | null;
};

export type NodeBlock = {
  type: string;
  text?: string | null;
  marks?: NodeBlockMark[];
};

export type NodeBlockMark = {
  type: string;
  attrs: any;
};

export type NodeWithChildren = Node & {
  children: NodeWithChildren[];
};
