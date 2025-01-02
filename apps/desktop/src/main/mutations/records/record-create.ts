import { generateId, IdType, RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  RecordCreateMutationInput,
  RecordCreateMutationOutput,
} from '@/shared/mutations/records/record-create';

export class RecordCreateMutationHandler
  implements MutationHandler<RecordCreateMutationInput>
{
  async handleMutation(
    input: RecordCreateMutationInput
  ): Promise<RecordCreateMutationOutput> {
    const id = generateId(IdType.Record);
    const attributes: RecordAttributes = {
      type: 'record',
      parentId: input.databaseId,
      databaseId: input.databaseId,
      name: input.name ?? '',
      fields: input.fields ?? {},
      content: {},
    };

    await entryService.createEntry(input.userId, {
      id,
      attributes,
      parentId: input.databaseId,
    });

    return {
      id: id,
    };
  }
}
