import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/shared/lib/nodes';
import { MutationHandler } from '@/main/types';
import {
  DatabaseCreateMutationInput,
  DatabaseCreateMutationOutput,
} from '@/shared/mutations/database-create';
import { DatabaseAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput
  ): Promise<DatabaseCreateMutationOutput> {
    const databaseId = generateId(IdType.Database);
    const viewId = generateId(IdType.View);
    const fieldId = generateId(IdType.Field);

    const attributes: DatabaseAttributes = {
      type: 'database',
      name: input.name,
      parentId: input.spaceId,
      fields: {
        [fieldId]: {
          id: fieldId,
          type: 'text',
          index: generateNodeIndex(null, null),
          name: 'Comment',
        },
      },
      views: {
        [viewId]: {
          id: viewId,
          type: 'table',
          name: 'Default',
          fields: {},
          filters: {},
          sorts: {},
          avatar: null,
          index: generateNodeIndex(null, null),
          groupBy: null,
        },
      },
    };

    await nodeService.createNode(input.userId, {
      id: databaseId,
      attributes,
    });

    return {
      id: databaseId,
    };
  }
}
