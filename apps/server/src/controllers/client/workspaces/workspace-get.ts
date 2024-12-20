import { WorkspaceRole, WorkspaceOutput } from '@colanode/core';
import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';

export const workspaceGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;

  const workspace = await database
    .selectFrom('workspaces')
    .selectAll()
    .where('id', '=', workspaceId)
    .executeTakeFirst();

  if (!workspace) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Workspace not found.',
    });
    return;
  }

  const user = await database
    .selectFrom('users')
    .selectAll()
    .where('workspace_id', '=', workspaceId)
    .where('account_id', '=', res.locals.account.id)
    .executeTakeFirst();

  if (!user) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const output: WorkspaceOutput = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    versionId: workspace.version_id,
    user: {
      id: user.id,
      accountId: user.account_id,
      role: user.role as WorkspaceRole,
    },
  };

  res.status(200).json(output);
};
