import { createDebugger } from '@colanode/core';

import { net } from 'electron';
import fs from 'fs';
import path from 'path';

import { databaseService } from '@/main/data/database-service';
import { getAccountAvatarsDirectoryPath } from '@/main/utils';
import { httpClient } from '@/shared/lib/http-client';

class AvatarService {
  private readonly debug = createDebugger('desktop:service:avatar');

  public async handleAvatarRequest(request: Request): Promise<Response> {
    const url = request.url.replace('avatar://', '');
    const [accountId, avatarId] = url.split('/');
    if (!accountId || !avatarId) {
      this.debug(`Invalid avatar request url: ${url}`);
      return new Response(null, { status: 400 });
    }

    const avatarsDir = getAccountAvatarsDirectoryPath(accountId);
    const avatarPath = path.join(avatarsDir, `${avatarId}.jpeg`);
    const avatarLocalUrl = `file://${avatarPath}`;

    // Check if the avatar file already exists
    if (fs.existsSync(avatarPath)) {
      return net.fetch(avatarLocalUrl);
    }

    this.debug(`Downloading avatar ${avatarId} for account ${accountId}`);
    // Download the avatar file if it doesn't exist
    const credentials = await databaseService.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['domain', 'attributes', 'token'])
      .where('id', '=', accountId)
      .executeTakeFirst();

    if (!credentials) {
      this.debug(`Account ${accountId} not found`);
      return new Response(null, { status: 404 });
    }

    const response = await httpClient.get<NodeJS.ReadableStream>(
      `/v1/avatars/${avatarId}`,
      {
        domain: credentials.domain,
        token: credentials.token,
        responseType: 'stream',
      }
    );

    if (response.status !== 200 || !response.data) {
      this.debug(
        `Failed to download avatar ${avatarId} for account ${accountId}`
      );
      return new Response(null, { status: 404 });
    }

    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(avatarPath);

    return new Promise((resolve, reject) => {
      response.data.pipe(fileStream);

      fileStream.on('finish', async () => {
        // Ensure the file is written before trying to fetch it
        this.debug(`Avatar ${avatarId} for account ${accountId} downloaded`);
        resolve(net.fetch(avatarLocalUrl));
      });

      fileStream.on('error', (err) => {
        this.debug(
          `Failed to download avatar ${avatarId} for account ${accountId}`
        );
        reject(new Response(null, { status: 500, statusText: err.message }));
      });
    });
  }
}

export const avatarService = new AvatarService();
