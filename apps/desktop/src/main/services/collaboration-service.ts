import { ServerCollaboration } from '@colanode/core';

import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';

class CollaborationService {
  private readonly debug = createDebugger('service:collaboration');

  public async syncServerCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    this.debug(
      `Applying server collaboration: ${collaboration.nodeId} for user ${userId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('collaborations')
      .values({
        node_id: collaboration.nodeId,
        role: collaboration.role,
        created_at: collaboration.createdAt,
        updated_at: collaboration.updatedAt,
        deleted_at: collaboration.deletedAt,
        version: BigInt(collaboration.version),
      })
      .onConflict((oc) =>
        oc
          .columns(['node_id'])
          .doUpdateSet({
            role: collaboration.role,
            version: BigInt(collaboration.version),
            updated_at: collaboration.updatedAt,
            deleted_at: collaboration.deletedAt,
          })
          .where('version', '<', BigInt(collaboration.version))
      )
      .execute();

    if (collaboration.deletedAt) {
      await workspaceDatabase.transaction().execute(async (tx) => {
        await tx
          .deleteFrom('nodes')
          .where('id', '=', collaboration.nodeId)
          .execute();

        await tx
          .deleteFrom('transactions')
          .where('node_id', '=', collaboration.nodeId)
          .execute();

        await tx
          .deleteFrom('interaction_events')
          .where('node_id', '=', collaboration.nodeId)
          .execute();

        await tx
          .deleteFrom('interactions')
          .where('node_id', '=', collaboration.nodeId)
          .execute();
      });

      eventBus.publish({
        type: 'collaboration_deleted',
        userId,
        nodeId: collaboration.nodeId,
      });
    } else {
      eventBus.publish({
        type: 'collaboration_created',
        userId,
        nodeId: collaboration.nodeId,
      });
    }
  }
}

export const collaborationService = new CollaborationService();
