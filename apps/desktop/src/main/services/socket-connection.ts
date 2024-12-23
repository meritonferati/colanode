import { Message } from '@colanode/core';
import { WebSocket } from 'ws';

import { scheduler } from '@/main/scheduler';
import { createDebugger } from '@/main/debugger';
import { SelectAccount } from '@/main/data/app/schema';
import { syncService } from '@/main/services/sync-service';
import { BackoffCalculator } from '@/shared/lib/backoff-calculator';
import { eventBus } from '@/shared/lib/event-bus';

export class SocketConnection {
  private readonly debug = createDebugger('service:socket-connection');

  private readonly synapseUrl: string;
  private readonly account: SelectAccount;
  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  constructor(synapseUrl: string, account: SelectAccount) {
    this.synapseUrl = synapseUrl;
    this.account = account;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;
  }

  public init(): void {
    this.debug(`Initializing socket connection for account ${this.account.id}`);

    if (this.isConnected()) {
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    this.socket = new WebSocket(this.synapseUrl, {
      headers: {
        authorization: this.account.token,
      },
    });

    this.socket.onmessage = async (event) => {
      let data: string;

      if (typeof event.data === 'string') {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        console.error('Unsupported message data type:', typeof event.data);
        return;
      }
      const message: Message = JSON.parse(data);
      this.debug(
        `Received message of type ${message.type} for account ${this.account.id}`
      );

      if (message.type === 'transactions_batch') {
        const transactionsConsumer = syncService.getTransactionsConsumer(
          message.userId,
          message.rootId
        );
        transactionsConsumer?.processTransactions(message);
      } else if (message.type === 'collaborations_batch') {
        const collaborationsConsumer = syncService.getCollaborationsConsumer(
          message.userId
        );
        collaborationsConsumer?.processCollaborations(message);
      } else if (message.type === 'interactions_batch') {
        const interactionsConsumer = syncService.getInteractionsConsumer(
          message.userId,
          message.rootId
        );
        interactionsConsumer?.processInteractions(message);
      } else if (message.type === 'users_batch') {
        const usersConsumer = syncService.getUsersConsumer(message.userId);
        usersConsumer?.processUsers(message);
      } else if (message.type === 'files_batch') {
        const filesConsumer = syncService.getFilesConsumer(
          message.userId,
          message.rootId
        );
        filesConsumer?.processFiles(message);
      } else if (message.type === 'messages_batch') {
        const messagesConsumer = syncService.getMessagesConsumer(
          message.userId,
          message.rootId
        );
        messagesConsumer?.processMessages(message);
      } else if (message.type === 'message_reactions_batch') {
        const messageReactionsConsumer =
          syncService.getMessageReactionsConsumer(
            message.userId,
            message.rootId
          );
        messageReactionsConsumer?.processMessageReactions(message);
      } else if (message.type === 'account_updated') {
        scheduler.trigger({
          type: 'sync_account',
          accountId: this.account.id,
        });
      } else if (message.type === 'workspace_updated') {
        scheduler.trigger({
          type: 'sync_account',
          accountId: this.account.id,
        });
      } else if (message.type === 'workspace_deleted') {
        scheduler.trigger({
          type: 'sync_account',
          accountId: this.account.id,
        });
      }
    };

    this.socket.onopen = () => {
      this.debug(`Socket connection for account ${this.account.id} opened`);

      this.backoffCalculator.reset();
      eventBus.publish({
        type: 'socket_connection_opened',
        accountId: this.account.id,
      });
    };

    this.socket.onerror = () => {
      this.debug(`Socket connection for account ${this.account.id} errored`);
      this.backoffCalculator.increaseError();
    };

    this.socket.onclose = () => {
      this.debug(`Socket connection for account ${this.account.id} closed`);
      this.backoffCalculator.increaseError();
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: Message): boolean {
    if (this.socket && this.isConnected()) {
      this.debug(
        `Sending message of type ${message.type} for account ${this.account.id}`
      );

      this.socket.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  public close(): void {
    if (this.socket) {
      this.debug(`Closing socket connection for account ${this.account.id}`);
      this.socket.close();
    }
  }

  public checkConnection(): void {
    if (this.isConnected()) {
      return;
    }

    if (this.socket == null || this.socket.readyState === WebSocket.CLOSED) {
      this.init();
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      this.closingCount++;

      if (this.closingCount > 50) {
        this.socket.terminate();
        this.closingCount = 0;
      }
    }
  }
}
