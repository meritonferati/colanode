import {
  compareString,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FieldCreateMutationInput,
  FieldCreateMutationOutput,
} from '@/shared/mutations/field-create';

export class FieldCreateMutationHandler
  implements MutationHandler<FieldCreateMutationInput>
{
  async handleMutation(
    input: FieldCreateMutationInput
  ): Promise<FieldCreateMutationOutput> {
    const fieldId = generateId(IdType.Field);
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Invalid node type');
        }

        const maxIndex = Object.values(attributes.fields)
          .map((field) => field.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateNodeIndex(maxIndex, null);

        attributes.fields[fieldId] = {
          id: fieldId,
          type: input.fieldType,
          name: input.name,
          index,
        };

        return attributes;
      }
    );

    return {
      id: fieldId,
    };
  }
}
