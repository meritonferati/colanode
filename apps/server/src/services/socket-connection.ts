import { WebSocket } from 'ws';
import {
  CollaborationsBatchMessage,
  InitSyncConsumerMessage,
  InteractionsBatchMessage,
  Message,
  TransactionsBatchMessage,
  NodeType,
  SyncConsumerType,
  WorkspaceStatus,
  DeletedCollaborationsBatchMessage,
} from '@colanode/core';

import { interactionService } from '@/services/interaction-service';
import { createLogger } from '@/lib/logger';
import { RequestAccount } from '@/types/api';
import { database } from '@/data/database';
import {
  mapCollaboration,
  mapDeletedCollaboration,
  mapInteraction,
  mapTransaction,
} from '@/lib/nodes';
import {
  AccountUpdatedEvent,
  CollaboratorAddedEvent,
  CollaboratorRemovedEvent,
  Event,
  InteractionUpdatedEvent,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
  WorkspaceUserCreatedEvent,
} from '@/types/events';

const PUBLIC_NODES: NodeType[] = ['workspace', 'user'];

type SocketSyncConsumer = {
  type: SyncConsumerType;
  cursor: string;
  fetching: boolean;
};

type SocketUser = {
  userId: string;
  workspaceId: string;
  consumers: Map<SyncConsumerType, SocketSyncConsumer>;
};

export class SocketConnection {
  private readonly logger = createLogger('socket-connection');
  private readonly account: RequestAccount;
  private readonly socket: WebSocket;

  private readonly users: Map<string, SocketUser> = new Map();
  private readonly pendingUsers: Map<string, Promise<SocketUser | null>> =
    new Map();

  constructor(account: RequestAccount, socket: WebSocket) {
    this.account = account;
    this.socket = socket;

    this.socket.on('message', (data) => {
      const message = JSON.parse(data.toString()) as Message;
      this.handleMessage(message);
    });
  }

  public getDeviceId() {
    return this.account.deviceId;
  }

  public getAccountId() {
    return this.account.id;
  }

  public sendMessage(message: Message) {
    this.socket.send(JSON.stringify(message));
  }

  public close() {
    this.socket.close();
  }

  public handleEvent(event: Event) {
    if (event.type === 'node_created') {
      this.handleNodeCreatedEvent(event);
    } else if (event.type === 'node_updated') {
      this.handleNodeUpdatedEvent(event);
    } else if (event.type === 'node_deleted') {
      this.handleNodeDeletedEvent(event);
    } else if (event.type === 'collaborator_added') {
      this.handleCollaboratorAddedEvent(event);
    } else if (event.type === 'collaborator_removed') {
      this.handleCollaboratorRemovedEvent(event);
    } else if (event.type === 'interaction_updated') {
      this.handleInteractionUpdatedEvent(event);
    } else if (event.type === 'account_updated') {
      this.handleAccountUpdatedEvent(event);
    } else if (event.type === 'workspace_user_created') {
      this.handleWorkspaceUserCreatedEvent(event);
    } else if (event.type === 'workspace_updated') {
      this.handleWorkspaceUpdatedEvent(event);
    } else if (event.type === 'workspace_deleted') {
      this.handleWorkspaceDeletedEvent(event);
    }
  }

  private async handleMessage(message: Message) {
    this.logger.trace(message, `Socket message from ${this.account.id}`);

    if (message.type === 'init_sync_consumer') {
      this.handleInitSyncConsumer(message);
    } else if (message.type === 'sync_interactions') {
      interactionService.syncLocalInteractions(this.account.id, message);
    }
  }

  private async handleInitSyncConsumer(message: InitSyncConsumerMessage) {
    this.logger.info(
      `Init sync consumer from ${this.account.id} and user ${message.userId} for ${message.consumerType}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    const consumer = user.consumers.get(message.consumerType);
    if (!consumer) {
      const newConsumer: SocketSyncConsumer = {
        type: message.consumerType,
        cursor: message.cursor,
        fetching: false,
      };
      user.consumers.set(message.consumerType, newConsumer);
      this.consumePendingSync(user, newConsumer);
    } else if (!consumer.fetching && consumer.cursor !== message.cursor) {
      consumer.cursor = message.cursor;
      this.consumePendingSync(user, consumer);
    }
  }

  private async consumePendingSync(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.type === 'transactions') {
      this.consumeTransactions(user, consumer);
    } else if (consumer.type === 'deleted_collaborations') {
      this.consumeDeletedCollaborations(user, consumer);
    } else if (consumer.type === 'collaborations') {
      this.consumeCollaborations(user, consumer);
    } else if (consumer.type === 'interactions') {
      this.consumeInteractions(user, consumer);
    }
  }

  private async consumeTransactions(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      `Checking for pending node transactions for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
    );

    const unsyncedTransactions = await database
      .selectFrom('transactions as t')
      .leftJoin('collaborations as c', (join) =>
        join
          .on('c.user_id', '=', user.userId)
          .onRef('c.node_id', '=', 't.node_id')
      )
      .selectAll('t')
      .where((eb) =>
        eb.or([
          eb.and([
            eb('t.workspace_id', '=', user.workspaceId),
            eb('t.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('t.node_id')),
        ])
      )
      .where('t.version', '>', BigInt(consumer.cursor))
      .orderBy('t.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      this.logger.trace(
        `No pending node transactions found for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
      );
      consumer.fetching = false;
      return;
    }

    const transactions = unsyncedTransactions.map(mapTransaction);
    const message: TransactionsBatchMessage = {
      type: 'transactions_batch',
      userId: user.userId,
      transactions,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeDeletedCollaborations(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      `Checking for pending deleted collaborations for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
    );

    const unsyncedDeletedCollaborations = await database
      .selectFrom('deleted_collaborations as dc')
      .selectAll()
      .where('dc.user_id', '=', user.userId)
      .where('dc.version', '>', BigInt(consumer.cursor))
      .orderBy('dc.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedDeletedCollaborations.length === 0) {
      this.logger.trace(
        `No pending deleted collaborations found for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
      );
      consumer.fetching = false;
      return;
    }

    const deletedCollaborations = unsyncedDeletedCollaborations.map(
      mapDeletedCollaboration
    );
    const message: DeletedCollaborationsBatchMessage = {
      type: 'deleted_collaborations_batch',
      userId: user.userId,
      deletedCollaborations,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeCollaborations(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      `Checking for pending collaborations for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
    );

    const unsyncedCollaborations = await database
      .selectFrom('collaborations as c')
      .selectAll()
      .where('c.user_id', '=', user.userId)
      .where('c.version', '>', BigInt(consumer.cursor))
      .orderBy('c.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedCollaborations.length === 0) {
      this.logger.trace(
        `No pending collaborations found for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
      );
      consumer.fetching = false;
      return;
    }

    const collaborations = unsyncedCollaborations.map(mapCollaboration);
    const message: CollaborationsBatchMessage = {
      type: 'collaborations_batch',
      userId: user.userId,
      collaborations,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeInteractions(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      `Checking for pending interactions for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
    );

    const unsyncedInteractions = await database
      .selectFrom('interactions as i')
      .leftJoin('collaborations as c', (join) =>
        join
          .on('c.user_id', '=', user.userId)
          .onRef('c.node_id', '=', 'i.node_id')
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb('i.workspace_id', '=', user.workspaceId),
            eb('i.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('i.node_id')),
        ])
      )
      .selectAll('i')
      .where('i.version', '>', BigInt(consumer.cursor))
      .orderBy('i.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedInteractions.length === 0) {
      this.logger.trace(
        `No pending interactions found for ${this.account.id} and user ${user.userId} with cursor ${consumer.cursor}`
      );
      consumer.fetching = false;
      return;
    }

    const interactions = unsyncedInteractions.map(mapInteraction);
    const message: InteractionsBatchMessage = {
      type: 'interactions_batch',
      userId: user.userId,
      interactions,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async handleNodeCreatedEvent(event: NodeCreatedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }

      const collaborationsConsumer = user.consumers.get('collaborations');
      if (collaborationsConsumer) {
        this.consumePendingSync(user, collaborationsConsumer);
      }

      const interactionsConsumer = user.consumers.get('interactions');
      if (interactionsConsumer) {
        this.consumePendingSync(user, interactionsConsumer);
      }
    }
  }

  private async handleNodeUpdatedEvent(event: NodeUpdatedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }
    }
  }

  private async handleNodeDeletedEvent(event: NodeDeletedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }

      const deletedCollaborationsConsumer = user.consumers.get(
        'deleted_collaborations'
      );
      if (deletedCollaborationsConsumer) {
        this.consumePendingSync(user, deletedCollaborationsConsumer);
      }
    }
  }

  private async handleCollaboratorAddedEvent(event: CollaboratorAddedEvent) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const collaborationsConsumer = user.consumers.get('collaborations');
      if (collaborationsConsumer) {
        this.consumePendingSync(user, collaborationsConsumer);
      }
    }
  }

  private async handleCollaboratorRemovedEvent(
    event: CollaboratorRemovedEvent
  ) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const deletedCollaborationsConsumer = user.consumers.get(
        'deleted_collaborations'
      );
      if (deletedCollaborationsConsumer) {
        this.consumePendingSync(user, deletedCollaborationsConsumer);
      }
    }
  }

  private async handleInteractionUpdatedEvent(event: InteractionUpdatedEvent) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const interactionsConsumer = user.consumers.get('interactions');
      if (interactionsConsumer) {
        this.consumePendingSync(user, interactionsConsumer);
      }
    }
  }

  private async getOrCreateUser(userId: string): Promise<SocketUser | null> {
    const existingUser = this.users.get(userId);
    if (existingUser) {
      return existingUser;
    }

    const pendingUser = this.pendingUsers.get(userId);
    if (pendingUser) {
      return pendingUser;
    }

    const userPromise = this.fetchAndCreateUser(userId);
    this.pendingUsers.set(userId, userPromise);

    try {
      const user = await userPromise;
      return user;
    } finally {
      this.pendingUsers.delete(userId);
    }
  }

  private async fetchAndCreateUser(userId: string): Promise<SocketUser | null> {
    const workspaceUser = await database
      .selectFrom('workspace_users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();

    if (
      !workspaceUser ||
      workspaceUser.status !== WorkspaceStatus.Active ||
      workspaceUser.account_id !== this.account.id
    ) {
      return null;
    }

    const addedSocketUser = this.users.get(userId);
    if (addedSocketUser) {
      return addedSocketUser;
    }

    // Create and store the new SocketUser
    const newSocketUser: SocketUser = {
      userId,
      workspaceId: workspaceUser.workspace_id,
      consumers: new Map(),
    };

    this.users.set(userId, newSocketUser);
    return newSocketUser;
  }

  private handleAccountUpdatedEvent(event: AccountUpdatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'account_updated',
      accountId: this.account.id,
    });
  }

  private handleWorkspaceUserCreatedEvent(event: WorkspaceUserCreatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'workspace_user_created',
      workspaceId: event.workspaceId,
      userId: event.userId,
      accountId: event.accountId,
    });
  }

  private handleWorkspaceUpdatedEvent(event: WorkspaceUpdatedEvent) {
    const workspaceUsers = Array.from(this.users.values()).filter(
      (user) => user.workspaceId === event.workspaceId
    );

    if (workspaceUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_updated',
      workspaceId: event.workspaceId,
    });
  }

  private handleWorkspaceDeletedEvent(event: WorkspaceDeletedEvent) {
    const workspaceUsers = Array.from(this.users.values()).filter(
      (user) => user.workspaceId === event.workspaceId
    );

    if (workspaceUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_deleted',
      accountId: this.account.id,
    });
  }
}
