import { databaseManager } from '@/main/data/database-manager';
import { buildAxiosInstance } from '@/lib/servers';
import { WorkspaceCreateMutationInput } from '@/operations/mutations/workspace-create';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { WorkspaceOutput } from '@/types/workspaces';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput,
  ): Promise<MutationResult<WorkspaceCreateMutationInput>> {
    const account = await databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseManager.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const axios = buildAxiosInstance(
      server.domain,
      server.attributes,
      account.token,
    );
    const { data } = await axios.post<WorkspaceOutput>(`/v1/workspaces`, {
      name: input.name,
      description: input.description,
      avatar: input.avatar,
    });

    await databaseManager.appDatabase
      .insertInto('workspaces')
      .values({
        workspace_id: data.id ?? data.id,
        account_id: data.user.accountId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        role: data.user.role,
        user_id: data.user.id,
        version_id: data.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .execute();

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      data.user.id,
    );

    const user = data.user.node;
    await workspaceDatabase
      .insertInto('nodes')
      .values({
        id: user.id,
        attributes: JSON.stringify(user.attributes),
        state: user.state,
        created_at: user.createdAt,
        created_by: user.createdBy,
        updated_at: user.updatedAt,
        updated_by: user.updatedBy,
        server_created_at: user.serverCreatedAt,
        server_updated_at: user.serverUpdatedAt,
        version_id: user.versionId,
        server_version_id: user.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .execute();

    const changedTables: MutationChange[] = [
      {
        type: 'app',
        table: 'workspaces',
      },
      {
        type: 'workspace',
        table: 'nodes',
        userId: user.id,
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
