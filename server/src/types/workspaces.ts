export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export enum WorkspaceRole {
  Owner = 'owner',
  Admin = 'admin',
  Collaborator = 'collaborator',
  Viewer = 'viewer',
}

export enum WorkspaceUserStatus {
  Active = 1,
  Inactive = 2,
}

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceStatus;
  versionId: string;
};

export type WorkspaceUser = {
  id: string;
  workspaceId: string;
  accountId: string;
  role: WorkspaceRole;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceUserStatus;
  versionId: string;
};

export type WorkspaceInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type WorkspaceOutput = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  accountId: string;
  role: string;
  userId: string;
};

export type WorkspaceAccountsInviteInput = {
  emails: string[];
};

export type WorkspaceAccountRoleUpdateInput = {
  role: WorkspaceRole;
};
