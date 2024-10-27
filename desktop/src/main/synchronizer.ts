import fs from 'fs';
import { httpClient } from '@/lib/http-client';
import { databaseManager } from '@/main/data/database-manager';
import { ServerSyncResponse } from '@/types/sync';
import { WorkspaceCredentials } from '@/types/workspaces';
import { fileManager } from '@/main/file-manager';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
} from '@/main/utils';

const EVENT_LOOP_INTERVAL = 1000;

class Synchronizer {
  private initiated: boolean = false;

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init() {
    if (this.initiated) {
      return;
    }

    setTimeout(this.executeEventLoop, 10);
    this.initiated = true;
  }

  private async executeEventLoop() {
    try {
      await this.syncDeletedTokens();
      await this.syncWorkspaces();
    } catch (error) {
      console.log('error', error);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async syncDeletedTokens() {
    const deletedTokens = await databaseManager.appDatabase
      .selectFrom('deleted_tokens')
      .innerJoin('servers', 'deleted_tokens.server', 'servers.domain')
      .select([
        'deleted_tokens.token',
        'deleted_tokens.account_id',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    if (deletedTokens.length === 0) {
      return;
    }

    for (const deletedToken of deletedTokens) {
      try {
        const { status } = await httpClient.delete(`/v1/accounts/logout`, {
          serverDomain: deletedToken.domain,
          serverAttributes: deletedToken.attributes,
          token: deletedToken.token,
        });

        if (status !== 200) {
          return;
        }

        await databaseManager.appDatabase
          .deleteFrom('deleted_tokens')
          .where('token', '=', deletedToken.token)
          .where('account_id', '=', deletedToken.account_id)
          .execute();
      } catch (error) {
        // console.log('error', error);
      }
    }
  }

  private async syncWorkspaces() {
    const workspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'workspaces.account_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    for (const workspace of workspaces) {
      const credentials: WorkspaceCredentials = {
        workspaceId: workspace.workspace_id,
        accountId: workspace.account_id,
        userId: workspace.user_id,
        token: workspace.token,
        serverDomain: workspace.domain,
        serverAttributes: workspace.attributes,
      };

      try {
        await this.checkForChanges(credentials);
        await fileManager.checkForUploads(credentials);
        await fileManager.checkForDownloads(credentials);
      } catch (error) {
        // console.log('error', error);
      }
    }
  }

  private async checkForChanges(credentials: WorkspaceCredentials) {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      credentials.userId,
    );

    let hasMoreChanges = true;
    while (hasMoreChanges) {
      const changes = await workspaceDatabase
        .selectFrom('changes')
        .selectAll()
        .orderBy('id asc')
        .limit(20)
        .execute();

      if (changes.length === 0) {
        hasMoreChanges = false;
        break;
      }

      const { data } = await httpClient.post<ServerSyncResponse>(
        `/v1/sync/${credentials.workspaceId}`,
        {
          changes: changes,
        },
        {
          serverDomain: credentials.serverDomain,
          serverAttributes: credentials.serverAttributes,
          token: credentials.token,
        },
      );

      const syncedChangeIds: number[] = [];
      const unsyncedChangeIds: number[] = [];
      for (const result of data.results) {
        if (result.status === 'success') {
          syncedChangeIds.push(result.id);
        } else {
          unsyncedChangeIds.push(result.id);
        }
      }

      if (syncedChangeIds.length > 0) {
        await workspaceDatabase
          .deleteFrom('changes')
          .where('id', 'in', syncedChangeIds)
          .execute();
      }

      if (unsyncedChangeIds.length > 0) {
        await workspaceDatabase
          .updateTable('changes')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', 'in', unsyncedChangeIds)
          .execute();

        //we just delete changes that have failed to sync for more than 5 times.
        //in the future we might need to revert the change locally.
        await workspaceDatabase
          .deleteFrom('changes')
          .where('retry_count', '>=', 5)
          .execute();
      }
    }
  }
}

export const synchronizer = new Synchronizer();
