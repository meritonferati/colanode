import {
  CanUpdateDocumentContext,
  createDebugger,
  DocumentContent,
  extractDocumentText,
  generateId,
  getNodeModel,
  IdType,
  NodeModel,
  SyncDocumentUpdateData,
  UpdateDocumentMutationData,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchNodeTree } from '@/main/lib/utils';
import { SelectDocument } from '@/main/databases/workspace';
import {
  mapDocument,
  mapDocumentState,
  mapDocumentUpdate,
} from '@/main/lib/mappers';

const UPDATE_RETRIES_LIMIT = 10;

export class DocumentService {
  private readonly debug = createDebugger('desktop:service:document');
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async updateDocument(id: string, update: Uint8Array) {
    const tree = await fetchNodeTree(this.workspace.database, id);
    if (!tree) {
      throw new Error('Node not found');
    }

    const node = tree[tree.length - 1];
    if (!node) {
      throw new Error('Node not found');
    }

    const model = getNodeModel(node.type);
    if (!model.documentSchema) {
      throw new Error('Node does not have a document schema');
    }

    const context: CanUpdateDocumentContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
      },
      node: node,
      tree: tree,
    };

    if (!model.canUpdateDocument(context)) {
      throw new Error('User does not have permission to update document');
    }

    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const document = await this.workspace.database
          .selectFrom('documents')
          .selectAll()
          .where('id', '=', id)
          .executeTakeFirst();

        if (document) {
          const result = await this.tryUpdateDocument(model, document, update);
          if (result) {
            return true;
          }
        } else {
          const result = await this.tryCreateDocument(model, id, update);
          if (result) {
            return true;
          }
        }
      } catch (error) {
        this.debug(`Failed to update document ${node.id}: ${error}`);
      }
    }
  }

  private async tryCreateDocument(
    model: NodeModel,
    id: string,
    update: Uint8Array
  ): Promise<boolean> {
    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', id)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const update of documentUpdates) {
      ydoc.applyUpdate(update.data);
    }

    ydoc.applyUpdate(update);

    const content = ydoc.getObject<DocumentContent>();
    if (!model.documentSchema?.safeParse(content).success) {
      throw new Error('Invalid document state');
    }

    const updateId = generateId(IdType.Update);
    const updatedAt = new Date().toISOString();
    const text = extractDocumentText(id, content);

    const { createdDocument, createdMutation } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdDocument = await trx
          .insertInto('documents')
          .returningAll()
          .values({
            id: id,
            content: JSON.stringify(content),
            local_revision: 0n,
            server_revision: 0n,
            created_at: updatedAt,
            created_by: this.workspace.userId,
          })
          .onConflict((cb) => cb.doNothing())
          .executeTakeFirst();

        if (!createdDocument) {
          throw new Error('Failed to create document');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'update_document',
            data: JSON.stringify({
              documentId: id,
              updateId: updateId,
              data: encodeState(update),
              createdAt: updatedAt,
            }),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        await trx
          .insertInto('document_texts')
          .values({
            id: id,
            text: text,
          })
          .executeTakeFirst();

        return { createdDocument, createdMutation };
      });

    if (createdDocument) {
      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        document: mapDocument(createdDocument),
      });
    }

    if (createdMutation) {
      this.workspace.mutations.triggerSync();
    }

    return true;
  }

  private async tryUpdateDocument(
    model: NodeModel,
    document: SelectDocument,
    update: Uint8Array
  ): Promise<boolean> {
    const documentState = await this.workspace.database
      .selectFrom('document_states')
      .selectAll()
      .where('id', '=', document.id)
      .executeTakeFirst();

    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', document.id)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc(documentState?.state);
    for (const update of documentUpdates) {
      ydoc.applyUpdate(update.data);
    }

    ydoc.applyUpdate(update);

    const content = ydoc.getObject<DocumentContent>();
    if (!model.documentSchema?.safeParse(content).success) {
      throw new Error('Invalid document state');
    }

    const localRevision = BigInt(document.local_revision) + 1n;
    const serverRevision = BigInt(document.server_revision) + 1n;
    const updateId = generateId(IdType.Update);
    const updatedAt = new Date().toISOString();
    const text = extractDocumentText(document.id, content);

    const { updatedDocument, createdUpdate, createdMutation } =
      await this.workspace.database.transaction().execute(async (trx) => {
        const updatedDocument = await trx
          .updateTable('documents')
          .returningAll()
          .set({
            content: JSON.stringify(content),
            local_revision: localRevision,
            server_revision: serverRevision,
            updated_at: updatedAt,
            updated_by: this.workspace.userId,
          })
          .where('id', '=', document.id)
          .where('local_revision', '=', document.local_revision)
          .executeTakeFirst();

        if (!updatedDocument) {
          throw new Error('Failed to update document');
        }

        const createdUpdate = await trx
          .insertInto('document_updates')
          .returningAll()
          .values({
            id: updateId,
            document_id: document.id,
            data: update,
            created_at: updatedAt,
          })
          .executeTakeFirst();

        if (!createdUpdate) {
          throw new Error('Failed to create update');
        }

        const mutationData: UpdateDocumentMutationData = {
          documentId: document.id,
          updateId: updateId,
          data: encodeState(update),
          createdAt: updatedAt,
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'update_document',
            data: JSON.stringify(mutationData),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        await trx
          .updateTable('document_texts')
          .set({
            text: text,
          })
          .where('id', '=', document.id)
          .executeTakeFirst();

        return {
          updatedDocument,
          createdMutation,
          createdUpdate,
        };
      });

    if (updatedDocument) {
      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        document: mapDocument(updatedDocument),
      });
    }

    if (createdUpdate) {
      eventBus.publish({
        type: 'document_update_created',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentUpdate: mapDocumentUpdate(createdUpdate),
      });
    }

    if (createdMutation) {
      this.workspace.mutations.triggerSync();
    }

    return true;
  }

  public async revertDocumentUpdate(data: UpdateDocumentMutationData) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const result = await this.tryRevertDocumentUpdate(data);
        if (result) {
          return;
        }
      } catch (error) {
        this.debug(
          `Failed to revert document update ${data.documentId}: ${error}`
        );
      }
    }
  }

  private async tryRevertDocumentUpdate(data: UpdateDocumentMutationData) {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    const document = await this.workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    if (!document) {
      return;
    }

    const model = getNodeModel(node.type);

    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', data.documentId)
      .orderBy('id', 'asc')
      .execute();

    const updateToDelete = documentUpdates.find(
      (update) => update.id === data.updateId
    );

    if (!updateToDelete) {
      return;
    }

    const documentState = await this.workspace.database
      .selectFrom('document_states')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    if (!documentState && documentUpdates.length === 1) {
      await this.workspace.database
        .deleteFrom('documents')
        .where('id', '=', data.documentId)
        .executeTakeFirst();

      await this.workspace.database
        .deleteFrom('document_updates')
        .where('id', '=', data.updateId)
        .executeTakeFirst();

      await this.workspace.database
        .deleteFrom('document_texts')
        .where('id', '=', data.documentId)
        .executeTakeFirst();

      eventBus.publish({
        type: 'document_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentId: data.documentId,
      });
    }

    const ydoc = new YDoc(documentState?.state);
    for (const update of documentUpdates) {
      if (update.id === data.updateId) {
        continue;
      }

      ydoc.applyUpdate(update.data);
    }

    const content = ydoc.getObject<DocumentContent>();
    if (!model.documentSchema?.safeParse(content).success) {
      throw new Error('Invalid document state');
    }

    const localRevision = BigInt(document.local_revision) + BigInt(1);
    const text = extractDocumentText(document.id, content);

    const { updatedDocument, deletedUpdate } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const updatedDocument = await trx
          .updateTable('documents')
          .returningAll()
          .set({
            content: JSON.stringify(content),
            local_revision: localRevision,
          })
          .where('id', '=', data.documentId)
          .where('local_revision', '=', node.local_revision)
          .executeTakeFirst();

        if (!updatedDocument) {
          throw new Error('Failed to update document');
        }

        const deletedUpdate = await trx
          .deleteFrom('document_updates')
          .returningAll()
          .where('id', '=', updateToDelete.id)
          .executeTakeFirst();

        if (!deletedUpdate) {
          throw new Error('Failed to delete update');
        }

        await trx
          .updateTable('document_texts')
          .set({
            text: text,
          })
          .where('id', '=', document.id)
          .executeTakeFirst();

        return { updatedDocument, deletedUpdate };
      });

    if (updatedDocument) {
      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        document: mapDocument(updatedDocument),
      });
    }

    if (deletedUpdate) {
      eventBus.publish({
        type: 'document_update_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentId: data.documentId,
        updateId: updateToDelete.id,
      });
    }

    return true;
  }

  public async syncServerDocumentUpdate(data: SyncDocumentUpdateData) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const result = await this.trySyncDocumentUpdate(data);
        if (result) {
          return;
        }
      } catch (error) {
        this.debug(`Failed to sync document update ${data.id}: ${error}`);
      }
    }
  }

  private async trySyncDocumentUpdate(
    data: SyncDocumentUpdateData
  ): Promise<boolean> {
    const document = await this.workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    const documentState = await this.workspace.database
      .selectFrom('document_states')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', data.documentId)
      .orderBy('id', 'asc')
      .execute();

    const mergedUpdateIds =
      data.mergedUpdates?.map((update) => update.id) ?? [];

    const ydoc = new YDoc(documentState?.state);
    ydoc.applyUpdate(data.data);

    const serverState = ydoc.getState();
    const serverRevision = BigInt(data.revision);

    for (const update of documentUpdates) {
      if (update.id === data.id || mergedUpdateIds.includes(update.id)) {
        continue;
      }

      ydoc.applyUpdate(update.data);
    }

    const content = ydoc.getObject<DocumentContent>();

    const localRevision = document
      ? BigInt(document?.local_revision) + BigInt(1)
      : BigInt(0);

    const updatesToDelete = [data.id, ...mergedUpdateIds];
    const text = extractDocumentText(data.documentId, content);

    if (document) {
      const { updatedDocument, upsertedState, deletedUpdates } =
        await this.workspace.database.transaction().execute(async (trx) => {
          const updatedDocument = await trx
            .updateTable('documents')
            .returningAll()
            .set({
              content: JSON.stringify(content),
              server_revision: serverRevision,
              local_revision: localRevision,
              updated_at: data.createdAt,
              updated_by: data.createdBy,
            })
            .where('id', '=', data.documentId)
            .where('local_revision', '=', document.local_revision)
            .executeTakeFirst();

          if (!updatedDocument) {
            throw new Error('Failed to update document');
          }

          const upsertedState = await trx
            .insertInto('document_states')
            .returningAll()
            .values({
              id: data.documentId,
              state: serverState,
              revision: serverRevision,
            })
            .onConflict((cb) =>
              cb
                .column('id')
                .doUpdateSet({
                  state: serverState,
                  revision: serverRevision,
                })
                .where('revision', '=', BigInt(documentState?.revision ?? 0))
            )
            .executeTakeFirst();

          if (!upsertedState) {
            throw new Error('Failed to update document state');
          }

          const deletedUpdates = await trx
            .deleteFrom('document_updates')
            .returningAll()
            .where('id', 'in', updatesToDelete)
            .execute();

          await trx
            .updateTable('document_texts')
            .set({
              text: text,
            })
            .where('id', '=', data.documentId)
            .executeTakeFirst();

          return { updatedDocument, upsertedState, deletedUpdates };
        });

      if (!updatedDocument) {
        return false;
      }

      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        document: mapDocument(updatedDocument),
      });

      if (upsertedState) {
        eventBus.publish({
          type: 'document_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          documentState: mapDocumentState(upsertedState),
        });
      }

      if (deletedUpdates) {
        for (const update of deletedUpdates) {
          eventBus.publish({
            type: 'document_update_deleted',
            accountId: this.workspace.accountId,
            workspaceId: this.workspace.id,
            documentId: data.documentId,
            updateId: update.id,
          });
        }
      }
    } else {
      const { createdDocument } = await this.workspace.database
        .transaction()
        .execute(async (trx) => {
          const createdDocument = await trx
            .insertInto('documents')
            .returningAll()
            .values({
              id: data.documentId,
              content: JSON.stringify(content),
              server_revision: serverRevision,
              local_revision: localRevision,
              created_at: data.createdAt,
              created_by: data.createdBy,
            })
            .onConflict((cb) => cb.doNothing())
            .executeTakeFirst();

          if (!createdDocument) {
            throw new Error('Failed to create document');
          }

          const createdState = await trx
            .insertInto('document_states')
            .returningAll()
            .values({
              id: data.documentId,
              state: serverState,
              revision: serverRevision,
            })
            .onConflict((cb) => cb.doNothing())
            .executeTakeFirst();

          if (!createdState) {
            throw new Error('Failed to create document state');
          }

          await trx
            .insertInto('document_texts')
            .values({
              id: data.documentId,
              text: text,
            })
            .executeTakeFirst();

          return { createdDocument };
        });

      if (!createdDocument) {
        return false;
      }

      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        document: mapDocument(createdDocument),
      });
    }

    return true;
  }
}
