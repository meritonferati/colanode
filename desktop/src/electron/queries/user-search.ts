import { UserSearchQueryInput } from '@/types/queries/user-search';
import { databaseContext } from '@/electron/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { UserNode } from '@/types/users';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class UserSearchQueryHandler
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(
    input: UserSearchQueryInput,
  ): Promise<QueryResult<UserSearchQueryInput>> {
    if (input.searchQuery.length === 0) {
      return {
        output: [],
        state: {
          rows: [],
        },
      };
    }

    const rows = await this.fetchNodes(input);
    return {
      output: this.buildUserNodes(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: UserSearchQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchNodes(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildUserNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(input: UserSearchQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.User}
        AND n.id != ${input.userId}
        AND nn.name MATCH ${input.searchQuery + '*'}
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildUserNodes = (rows: SelectNode[]): UserNode[] => {
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes);
      return {
        id: row.id,
        name: attributes.name,
        email: attributes.email,
        avatar: attributes.avatar,
      };
    });
  };
}
