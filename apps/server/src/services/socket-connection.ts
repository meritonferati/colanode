import { WebSocket } from 'ws';
import {
  Message,
  SynchronizerInput,
  SynchronizerInputMessage,
  WorkspaceStatus,
} from '@colanode/core';

import { createLogger } from '@/lib/logger';
import { RequestAccount } from '@/types/api';
import { database } from '@/data/database';
import {
  AccountUpdatedEvent,
  CollaborationCreatedEvent,
  CollaborationUpdatedEvent,
  Event,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
} from '@/types/events';
import { ConnectedUser } from '@/types/users';
import { BaseSynchronizer } from '@/synchronizers/base';
import { UserSynchronizer } from '@/synchronizers/users';
import { CollaborationSynchronizer } from '@/synchronizers/collaborations';
import { FileSynchronizer } from '@/synchronizers/files';
import { MessageSynchronizer } from '@/synchronizers/messages';
import { MessageReactionSynchronizer } from '@/synchronizers/message-reactions';
import { TransactionSynchronizer } from '@/synchronizers/transactions';

type SocketUser = {
  user: ConnectedUser;
  rootIds: Set<string>;
  synchronizers: Map<string, BaseSynchronizer<SynchronizerInput>>;
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

  private async handleMessage(message: Message) {
    this.logger.trace(message, `Socket message from ${this.account.id}`);

    if (message.type === 'synchronizer_input') {
      this.handleSynchronizerInput(message);
    }
  }

  public async handleEvent(event: Event) {
    if (event.type === 'account_updated') {
      this.handleAccountUpdatedEvent(event);
    } else if (event.type === 'workspace_updated') {
      this.handleWorkspaceUpdatedEvent(event);
    } else if (event.type === 'workspace_deleted') {
      this.handleWorkspaceDeletedEvent(event);
    } else if (event.type === 'collaboration_created') {
      this.handleCollaborationCreatedEvent(event);
    } else if (event.type === 'collaboration_updated') {
      this.handleCollaborationUpdatedEvent(event);
    }

    for (const user of this.users.values()) {
      for (const synchronizer of user.synchronizers.values()) {
        const output = await synchronizer.fetchDataFromEvent(event);
        if (output) {
          user.synchronizers.delete(synchronizer.id);
          this.sendMessage(output);
        }
      }
    }
  }

  private async handleSynchronizerInput(message: SynchronizerInputMessage) {
    this.logger.info(
      `Synchronizer input from ${this.account.id} and user ${message.userId} and input ${message.input}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    const synchronizer = this.buildSynchronizer(message, user);
    if (synchronizer === null) {
      return;
    }

    const output = await synchronizer.fetchData();
    if (output === null) {
      user.synchronizers.set(synchronizer.id, synchronizer);
      return;
    }

    this.sendMessage(output);
  }

  private buildSynchronizer(
    message: SynchronizerInputMessage,
    user: SocketUser
  ): BaseSynchronizer<SynchronizerInput> | null {
    const cursor = BigInt(message.cursor);
    if (message.input.type === 'users') {
      return new UserSynchronizer(message.id, user.user, message.input, cursor);
    } else if (message.input.type === 'collaborations') {
      return new CollaborationSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'files') {
      if (!user.rootIds.has(message.input.rootId)) {
        return null;
      }

      return new FileSynchronizer(message.id, user.user, message.input, cursor);
    } else if (message.input.type === 'messages') {
      if (!user.rootIds.has(message.input.rootId)) {
        return null;
      }

      return new MessageSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'message_reactions') {
      return new MessageReactionSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'transactions') {
      return new TransactionSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    }

    return null;
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
    const user = await database
      .selectFrom('users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();

    if (
      !user ||
      user.status !== WorkspaceStatus.Active ||
      user.account_id !== this.account.id
    ) {
      return null;
    }

    const collaborations = await database
      .selectFrom('collaborations')
      .selectAll()
      .where('collaborator_id', '=', userId)
      .execute();

    const addedSocketUser = this.users.get(userId);
    if (addedSocketUser) {
      return addedSocketUser;
    }

    // Create and store the new SocketUser
    const connectedUser: ConnectedUser = {
      userId: user.id,
      workspaceId: user.workspace_id,
      accountId: this.account.id,
      deviceId: this.account.deviceId,
    };

    const rootIds = new Set<string>();
    for (const collaboration of collaborations) {
      if (collaboration.deleted_at) {
        continue;
      }

      rootIds.add(collaboration.entry_id);
    }

    const socketUser: SocketUser = {
      user: connectedUser,
      rootIds,
      synchronizers: new Map(),
    };

    this.users.set(userId, socketUser);
    return socketUser;
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

  private handleWorkspaceUpdatedEvent(event: WorkspaceUpdatedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_updated',
      workspaceId: event.workspaceId,
    });
  }

  private handleWorkspaceDeletedEvent(event: WorkspaceDeletedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_deleted',
      accountId: this.account.id,
    });
  }

  private handleCollaborationCreatedEvent(event: CollaborationCreatedEvent) {
    const user = this.users.get(event.collaboratorId);
    if (!user) {
      return;
    }

    user.rootIds.add(event.entryId);
  }

  private async handleCollaborationUpdatedEvent(
    event: CollaborationUpdatedEvent
  ) {
    const user = this.users.get(event.collaboratorId);
    if (!user) {
      return;
    }

    const collaboration = await database
      .selectFrom('collaborations')
      .selectAll()
      .where('collaborator_id', '=', event.collaboratorId)
      .where('entry_id', '=', event.entryId)
      .executeTakeFirst();

    if (!collaboration || collaboration.deleted_at) {
      user.rootIds.delete(event.entryId);
    } else {
      user.rootIds.add(event.entryId);
    }
  }
}
