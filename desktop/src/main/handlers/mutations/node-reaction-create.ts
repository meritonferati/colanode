import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionCreateMutationInput } from '@/operations/mutations/node-reaction-create';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput,
  ): Promise<MutationResult<NodeReactionCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    await workspaceDatabase
      .insertInto('node_reactions')
      .values({
        node_id: input.nodeId,
        actor_id: input.userId,
        reaction: input.reaction,
        created_at: new Date().toISOString(),
      })
      .onConflict((b) => b.doNothing())
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'node_reactions',
          userId: input.userId,
        },
      ],
    };
  }
}
