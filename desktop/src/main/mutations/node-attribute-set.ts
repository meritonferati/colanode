import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeAttributeSetMutationInput } from '@/types/mutations/node-attribute-set';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput,
  ): Promise<MutationResult<NodeAttributeSetMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.nodeId)
      .selectAll()
      .executeTakeFirst();

    if (!node) {
      throw new Error('Node not found');
    }

    const doc = new Y.Doc({
      guid: node.id,
    });

    Y.applyUpdate(doc, toUint8Array(node.state));

    const attributesMap = doc.getMap('attributes');
    attributesMap.set(input.attribute, input.value);

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        state: encodedState,
        attributes: attributes,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: generateId(IdType.Version),
      })
      .where('id', '=', input.nodeId)
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
