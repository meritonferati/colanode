import { sql } from 'kysely';

import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { SelectUser } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapUser } from '@/main/lib/mappers';
import { UserSearchQueryInput } from '@/shared/queries/users/user-search';
import { Event } from '@/shared/types/events';
import { User } from '@/shared/types/users';

export class UserSearchQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(input: UserSearchQueryInput): Promise<User[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);

    return this.buildUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserSearchQueryInput,
    _: User[]
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'user_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'user_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'user_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async searchUsers(
    input: UserSearchQueryInput
  ): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const exclude = input.exclude ?? [];
    const query = sql<SelectUser>`
      SELECT u.*
      FROM users u
      JOIN texts t ON u.id = t.id
      WHERE u.id != ${workspace.userId}
        AND t.name MATCH ${input.searchQuery + '*'}
        ${
          exclude.length > 0
            ? sql`AND u.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspace.database);

    const result = await workspace.database.executeQuery(query);
    return result.rows;
  }

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const exclude = input.exclude ?? [];
    return workspace.database
      .selectFrom('users')
      .where('id', '!=', workspace.userId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectUser[]): User[] => {
    return rows.map((row) => mapUser(row));
  };
}
