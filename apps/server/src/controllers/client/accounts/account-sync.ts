import { Request, Response } from 'express';
import {
  AccountSyncOutput,
  WorkspaceOutput,
  WorkspaceRole,
  ApiErrorCode,
} from '@colanode/core';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';

export const accountSyncHandler = async (
  _: Request,
  res: Response
): Promise<void> => {
  const account = await database
    .selectFrom('accounts')
    .where('id', '=', res.locals.account.id)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    return ResponseBuilder.notFound(res, {
      code: ApiErrorCode.AccountNotFound,
      message: 'Account not found. Check your token.',
    });
  }

  const workspaceOutputs: WorkspaceOutput[] = [];
  const users = await database
    .selectFrom('users')
    .where('account_id', '=', account.id)
    .selectAll()
    .execute();

  if (users.length > 0) {
    const workspaceIds = users.map((u) => u.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .where('id', 'in', workspaceIds)
      .selectAll()
      .execute();

    for (const user of users) {
      const workspace = workspaces.find((w) => w.id === user.workspace_id);

      if (!workspace) {
        continue;
      }

      workspaceOutputs.push({
        id: workspace.id,
        name: workspace.name,
        versionId: workspace.version_id,
        avatar: workspace.avatar,
        description: workspace.description,
        user: {
          id: user.id,
          accountId: user.account_id,
          role: user.role as WorkspaceRole,
        },
      });
    }
  }

  const output: AccountSyncOutput = {
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    },
    workspaces: workspaceOutputs,
  };

  return ResponseBuilder.success(res, output);
};
