import { ChannelAttributes, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  ChannelCreateMutationInput,
  ChannelCreateMutationOutput,
} from '@/shared/mutations/channels/channel-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class ChannelCreateMutationHandler
  implements MutationHandler<ChannelCreateMutationInput>
{
  async handleMutation(
    input: ChannelCreateMutationInput
  ): Promise<ChannelCreateMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const space = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', input.spaceId)
      .executeTakeFirst();

    if (!space) {
      throw new MutationError(
        MutationErrorCode.SpaceNotFound,
        'Space not found or has been deleted.'
      );
    }

    const id = generateId(IdType.Channel);
    const attributes: ChannelAttributes = {
      type: 'channel',
      name: input.name,
      avatar: input.avatar,
      parentId: input.spaceId,
    };

    await entryService.createEntry(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}
