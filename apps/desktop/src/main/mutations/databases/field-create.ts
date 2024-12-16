import {
  compareString,
  FieldAttributes,
  FieldType,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FieldCreateMutationInput,
  FieldCreateMutationOutput,
} from '@/shared/mutations/databases/field-create';
import { MutationError } from '@/shared/mutations';

export class FieldCreateMutationHandler
  implements MutationHandler<FieldCreateMutationInput>
{
  async handleMutation(
    input: FieldCreateMutationInput
  ): Promise<FieldCreateMutationOutput> {
    if (input.fieldType === 'relation') {
      if (!input.relationDatabaseId) {
        throw new MutationError(
          'relation_database_not_found',
          'Relation database not found.'
        );
      }

      const relationDatabase = await nodeService.fetchNode(
        input.relationDatabaseId,
        input.userId
      );

      if (!relationDatabase || relationDatabase.type !== 'database') {
        throw new MutationError(
          'relation_database_not_found',
          'Relation database not found.'
        );
      }
    }

    const fieldId = generateId(IdType.Field);
    const result = await nodeService.updateNode(
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

        const newField: FieldAttributes = {
          id: fieldId,
          type: input.fieldType as FieldType,
          name: input.name,
          index,
        };

        if (newField.type === 'relation') {
          newField.databaseId = input.relationDatabaseId;
        }

        attributes.fields[fieldId] = newField;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to create a field in this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while creating the field.'
      );
    }

    return {
      id: fieldId,
    };
  }
}
