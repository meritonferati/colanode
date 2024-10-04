import axios from 'axios';
import { databaseContext } from '@/main/data/database-context';
import { buildApiBaseUrl } from '@/lib/servers';
import { WorkspaceCreateMutationInput } from '@/types/mutations/workspace-create';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { Workspace } from '@/types/workspaces';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput,
  ): Promise<MutationResult<WorkspaceCreateMutationInput>> {
    const account = await databaseContext.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const { data } = await axios.post<Workspace>(
      `${buildApiBaseUrl(server)}/v1/workspaces`,
      {
        name: input.name,
        description: input.description,
      },
      {
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      },
    );

    await databaseContext.appDatabase
      .insertInto('workspaces')
      .values({
        workspace_id: data.id ?? data.id,
        account_id: data.accountId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        role: data.role,
        synced: 0,
        user_id: data.userId,
        version_id: data.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .execute();

    const changedTables: MutationChange[] = [
      {
        type: 'app',
        table: 'workspaces',
      },
    ];

    return {
      output: {
        id: data.id,
      },
      changes: changedTables,
    };
  }
}
