import { ServerListQueryInput } from '@/shared/queries/server-list';
import { databaseService } from '@/main/data/database-service';
import { SelectServer } from '@/main/data/app/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { Server } from '@/shared/types/servers';
import { Event } from '@/shared/types/events';

export class ServerListQueryHandler
  implements QueryHandler<ServerListQueryInput>
{
  async handleQuery(_: ServerListQueryInput): Promise<Server[]> {
    const rows = await this.fetchServers();
    return this.mapServers(rows);
  }

  async checkForChanges(
    event: Event,
    _: ServerListQueryInput,
    output: Server[]
  ): Promise<ChangeCheckResult<ServerListQueryInput>> {
    if (event.type === 'server_created') {
      const newServers = [...output, event.server];
      return {
        hasChanges: true,
        result: newServers,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchServers(): Promise<SelectServer[]> {
    return databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .execute();
  }

  private mapServers = (rows: SelectServer[]): Server[] => {
    return rows.map((row) => {
      return {
        domain: row.domain,
        name: row.name,
        avatar: row.avatar,
        attributes: JSON.parse(row.attributes),
        version: row.version,
        createdAt: new Date(row.created_at),
        lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
      };
    });
  };
}
