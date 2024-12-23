import { databaseService } from '@/main/data/database-service';
import { UsersConsumer } from '@/main/consumers/users';
import { TransactionsConsumer } from '@/main/consumers/transactions';
import { CollaborationsConsumer } from '@/main/consumers/collaborations';
import { InteractionsConsumer } from '@/main/consumers/interactions';
import { FilesConsumer } from '@/main/consumers/files';
import { createDebugger } from '@/main/debugger';
import { MessagesConsumer } from '@/main/consumers/messages';
import { MessageReactionsConsumer } from '@/main/consumers/message-reactions';

export type NodeConsumersWrapper = {
  transactions: TransactionsConsumer;
  interactions: InteractionsConsumer;
  files: FilesConsumer;
  messages: MessagesConsumer;
  messageReactions: MessageReactionsConsumer;
};

export type ConsumersWrapper = {
  users: UsersConsumer;
  collaborations: CollaborationsConsumer;
  nodes: Record<string, NodeConsumersWrapper>;
};

class SyncService {
  private readonly debug = createDebugger('service:sync');
  private readonly users: Map<string, ConsumersWrapper> = new Map();

  public async initUserConsumers(accountId: string, userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    let consumers = this.users.get(userId);
    if (!consumers) {
      const usersConsumer = new UsersConsumer(
        userId,
        accountId,
        workspaceDatabase
      );
      await usersConsumer.init();

      const collaborationsConsumer = new CollaborationsConsumer(
        userId,
        accountId,
        workspaceDatabase
      );
      await collaborationsConsumer.init();

      consumers = {
        users: usersConsumer,
        collaborations: collaborationsConsumer,
        nodes: {},
      };

      this.users.set(userId, consumers);
    }

    const collaborations = await workspaceDatabase
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      const rootId = collaboration.node_id;

      if (consumers.nodes[rootId]) {
        continue;
      }

      const transactionsConsumer = new TransactionsConsumer(
        userId,
        accountId,
        rootId,
        workspaceDatabase
      );
      await transactionsConsumer.init();

      const interactionsConsumer = new InteractionsConsumer(
        userId,
        accountId,
        rootId,
        workspaceDatabase
      );
      await interactionsConsumer.init();

      const filesConsumer = new FilesConsumer(
        userId,
        accountId,
        rootId,
        workspaceDatabase
      );
      await filesConsumer.init();

      const messagesConsumer = new MessagesConsumer(
        userId,
        accountId,
        rootId,
        workspaceDatabase
      );
      await messagesConsumer.init();

      const messageReactionsConsumer = new MessageReactionsConsumer(
        userId,
        accountId,
        rootId,
        workspaceDatabase
      );
      await messageReactionsConsumer.init();

      consumers.nodes[rootId] = {
        transactions: transactionsConsumer,
        interactions: interactionsConsumer,
        files: filesConsumer,
        messages: messagesConsumer,
        messageReactions: messageReactionsConsumer,
      };
    }

    // check for deleted collaborations and remove them from the consumers
    for (const nodeId of Object.keys(consumers.nodes)) {
      if (!collaborations.some((c) => c.node_id === nodeId)) {
        delete consumers.nodes[nodeId];
      }
    }
  }

  public getUsersConsumer(userId: string): UsersConsumer | undefined {
    return this.users.get(userId)?.users;
  }

  public getCollaborationsConsumer(
    userId: string
  ): CollaborationsConsumer | undefined {
    return this.users.get(userId)?.collaborations;
  }

  public getTransactionsConsumer(
    userId: string,
    rootId: string
  ): TransactionsConsumer | undefined {
    return this.users.get(userId)?.nodes[rootId]?.transactions;
  }

  public getInteractionsConsumer(
    userId: string,
    rootId: string
  ): InteractionsConsumer | undefined {
    return this.users.get(userId)?.nodes[rootId]?.interactions;
  }

  public getFilesConsumer(
    userId: string,
    rootId: string
  ): FilesConsumer | undefined {
    return this.users.get(userId)?.nodes[rootId]?.files;
  }

  public getMessagesConsumer(
    userId: string,
    rootId: string
  ): MessagesConsumer | undefined {
    return this.users.get(userId)?.nodes[rootId]?.messages;
  }

  public getMessageReactionsConsumer(
    userId: string,
    rootId: string
  ): MessageReactionsConsumer | undefined {
    return this.users.get(userId)?.nodes[rootId]?.messageReactions;
  }
}

export const syncService = new SyncService();
