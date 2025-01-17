import { WorkspaceOutput } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import {
  WorkspaceCreateMutationInput,
  WorkspaceCreateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { mapWorkspace } from '@/main/utils';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput
  ): Promise<WorkspaceCreateMutationOutput> {
    const account = appService.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
      );
    }

    try {
      const { data } = await account.client.post<WorkspaceOutput>(
        `/v1/workspaces`,
        {
          name: input.name,
          description: input.description,
          avatar: input.avatar,
        }
      );

      const createdWorkspace = await account.database
        .insertInto('workspaces')
        .returningAll()
        .values({
          id: data.id,
          account_id: data.user.accountId,
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.user.role,
          user_id: data.user.id,
        })
        .onConflict((cb) => cb.doNothing())
        .executeTakeFirst();

      if (!createdWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotCreated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      const workspace = mapWorkspace(createdWorkspace);
      await account.initWorkspace(workspace);

      eventBus.publish({
        type: 'workspace_created',
        workspace: workspace,
      });

      return {
        id: createdWorkspace.id,
        userId: createdWorkspace.user_id,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
