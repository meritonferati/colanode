import { getIdType, IdType } from '@colanode/core';
import { Kysely } from 'kysely';

import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { mapWorkspace } from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import {
  Event,
  InteractionUpdatedEvent,
  NodeCreatedEvent,
} from '@/shared/types/events';
import {
  WorkspaceRadarData,
  ChannelReadState,
  ChatReadState,
} from '@/shared/types/radars';
import { Workspace } from '@/shared/types/workspaces';

interface UndreadMessage {
  messageId: string;
  parentId: string;
  parentIdType: IdType;
}

class RadarWorkspace {
  public readonly workspace: Workspace;
  private readonly workspaceDatabase: Kysely<WorkspaceDatabaseSchema>;
  private readonly unreadMessages: Map<string, UndreadMessage> = new Map();

  constructor(
    workspace: Workspace,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    this.workspace = workspace;
    this.workspaceDatabase = workspaceDatabase;
  }

  public getWorkspaceData(): WorkspaceRadarData {
    const data: WorkspaceRadarData = {
      accountId: this.workspace.accountId,
      userId: this.workspace.userId,
      workspaceId: this.workspace.id,
      importantCount: 0,
      hasUnseenChanges: false,
      nodeStates: {},
    };

    for (const unreadMessage of this.unreadMessages.values()) {
      if (unreadMessage.parentIdType === IdType.Channel) {
        let nodeState = data.nodeStates[
          unreadMessage.parentId
        ] as ChannelReadState;
        if (!nodeState) {
          nodeState = {
            type: 'channel',
            nodeId: unreadMessage.parentId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
          data.nodeStates[unreadMessage.parentId] = nodeState;
          data.hasUnseenChanges = true;
        }

        nodeState.unseenMessagesCount++;
      } else if (unreadMessage.parentIdType === IdType.Chat) {
        let nodeState = data.nodeStates[
          unreadMessage.parentId
        ] as ChatReadState;
        if (!nodeState) {
          nodeState = {
            type: 'chat',
            nodeId: unreadMessage.parentId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
          data.nodeStates[unreadMessage.parentId] = nodeState;
        }

        nodeState.unseenMessagesCount++;
        data.importantCount++;
      }
    }

    return data;
  }

  public async init(): Promise<void> {
    const unreadMessagesRows = await this.workspaceDatabase
      .selectFrom('nodes as node')
      .leftJoin('interactions as interaction', 'node.id', 'interaction.node_id')
      .select(['node.id as node_id', 'node.parent_id as parent_id'])
      .where('node.type', '=', 'message')
      .where('node.created_by', '!=', this.workspace.userId)
      .where('interaction.last_seen_at', 'is', null)
      .execute();

    for (const unreadMessageRow of unreadMessagesRows) {
      this.unreadMessages.set(unreadMessageRow.node_id, {
        messageId: unreadMessageRow.node_id,
        parentId: unreadMessageRow.parent_id,
        parentIdType: getIdType(unreadMessageRow.parent_id),
      });
    }
  }

  public async handleNodeCreated(event: NodeCreatedEvent): Promise<void> {
    if (event.userId !== this.workspace.userId) {
      return;
    }

    if (event.node.type !== 'message') {
      return;
    }

    if (event.node.createdBy === this.workspace.userId) {
      return;
    }

    const interactions = await this.workspaceDatabase
      .selectFrom('interactions')
      .selectAll()
      .where('node_id', '=', event.node.id)
      .where('user_id', '=', this.workspace.userId)
      .executeTakeFirst();

    if (interactions && interactions.last_seen_at) {
      return;
    }

    this.unreadMessages.set(event.node.id, {
      messageId: event.node.id,
      parentId: event.node.parentId,
      parentIdType: getIdType(event.node.parentId),
    });

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  public async handleInteractionUpdated(
    event: InteractionUpdatedEvent
  ): Promise<void> {
    if (
      event.userId !== this.workspace.userId ||
      event.interaction.userId !== this.workspace.userId
    ) {
      return;
    }

    const unreadMessage = this.unreadMessages.get(event.interaction.nodeId);
    if (!unreadMessage) {
      return;
    }

    if (event.interaction.attributes.lastSeenAt) {
      this.unreadMessages.delete(unreadMessage.messageId);

      eventBus.publish({
        type: 'radar_data_updated',
      });
    }
  }
}

class RadarService {
  private readonly workspaces: Map<string, RadarWorkspace> = new Map();

  constructor() {
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  public async init(): Promise<void> {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    for (const workspace of workspaces) {
      const workspaceDatabase = await databaseService.getWorkspaceDatabase(
        workspace.user_id
      );

      const radarWorkspace = new RadarWorkspace(
        mapWorkspace(workspace),
        workspaceDatabase
      );
      this.workspaces.set(workspace.user_id, radarWorkspace);
      await radarWorkspace.init();
    }

    eventBus.publish({
      type: 'radar_data_updated',
    });
  }

  public getData(): Record<string, WorkspaceRadarData> {
    const data: Record<string, WorkspaceRadarData> = {};
    for (const radarWorkspace of this.workspaces.values()) {
      data[radarWorkspace.workspace.userId] = radarWorkspace.getWorkspaceData();
    }
    return data;
  }

  private async handleEvent(event: Event) {
    if (event.type === 'workspace_deleted') {
      this.workspaces.delete(event.workspace.userId);
      eventBus.publish({
        type: 'radar_data_updated',
      });
    } else if (event.type === 'interaction_updated') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleInteractionUpdated(event);
      }
    } else if (event.type === 'node_created') {
      const radarWorkspace = this.workspaces.get(event.userId);
      if (radarWorkspace) {
        radarWorkspace.handleNodeCreated(event);
      }
    }
  }
}

export const radarService = new RadarService();
