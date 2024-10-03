import axios from 'axios';
import { LoginOutput } from '@/types/accounts';
import { databaseContext } from '@/electron/database-context';
import { buildApiBaseUrl, mapServer } from '@/lib/servers';
import { EmailRegisterMutationInput } from '@/types/mutations/email-register';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';

export class EmailRegisterMutationHandler
  implements MutationHandler<EmailRegisterMutationInput>
{
  handleMutation = async (
    input: EmailRegisterMutationInput,
  ): Promise<MutationResult<EmailRegisterMutationInput>> => {
    const serverRow = await databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.server)
      .executeTakeFirst();

    if (!serverRow) {
      return {
        output: {
          success: false,
        },
      };
    }

    const server = mapServer(serverRow);
    const { data } = await axios.post<LoginOutput>(
      `${buildApiBaseUrl(server)}/v1/accounts/register/email`,
      {
        name: input.name,
        email: input.email,
        password: input.password,
      },
    );

    const changedTables: MutationChange[] = [];
    await databaseContext.appDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('accounts')
        .values({
          id: data.account.id,
          name: data.account.name,
          avatar: data.account.avatar,
          device_id: data.account.deviceId,
          email: data.account.email,
          token: data.account.token,
          server: serverRow.domain,
        })
        .execute();

      changedTables.push({
        type: 'app',
        table: 'accounts',
      });

      if (data.workspaces.length === 0) {
        return;
      }

      await trx
        .insertInto('workspaces')
        .values(
          data.workspaces.map((workspace) => ({
            id: workspace.id,
            name: workspace.name,
            account_id: data.account.id,
            avatar: workspace.avatar,
            role: workspace.role,
            description: workspace.description,
            synced: 0,
            user_id: workspace.userId,
            version_id: workspace.versionId,
          })),
        )
        .execute();

      changedTables.push({
        type: 'app',
        table: 'workspaces',
      });
    });

    return {
      output: {
        success: true,
      },
      changedTables: changedTables,
    };
  };
}
