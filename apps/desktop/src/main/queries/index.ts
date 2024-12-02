import { AccountGetQueryHandler } from '@/main/queries/accounts/account-get';
import { AccountListQueryHandler } from '@/main/queries/accounts/accounts-list';
import { DownloadGetQueryHandler } from '@/main/queries/files/download-get';
import { EmojisGetQueryHandler } from '@/main/queries/emojis/emojis-get';
import { FileListQueryHandler } from '@/main/queries/files/file-list';
import { FileMetadataGetQueryHandler } from '@/main/queries/files/file-metadata-get';
import { IconsGetQueryHandler } from '@/main/queries/icons/icons-get';
import { MessageListQueryHandler } from '@/main/queries/messages/message-list';
import { NodeChildrenGetQueryHandler } from '@/main/queries/nodes/node-children-get';
import { NodeGetQueryHandler } from '@/main/queries/nodes/node-get';
import { NodeTreeGetQueryHandler } from '@/main/queries/nodes/node-tree-get';
import { RadarDataGetQueryHandler } from '@/main/queries/interactions/radar-data-get';
import { RecordListQueryHandler } from '@/main/queries/records/record-list';
import { ServerListQueryHandler } from '@/main/queries/servers/server-list';
import { UserSearchQueryHandler } from '@/main/queries/users/user-search';
import { WorkspaceGetQueryHandler } from '@/main/queries/workspaces/workspace-get';
import { WorkspaceListQueryHandler } from '@/main/queries/workspaces/workspace-list';
import { WorkspaceUserListQueryHandler } from '@/main/queries/workspaces/workspace-user-list';
import { QueryHandler } from '@/main/types';
import { QueryMap } from '@/shared/queries';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  account_list: new AccountListQueryHandler(),
  message_list: new MessageListQueryHandler(),
  node_get: new NodeGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  workspace_user_list: new WorkspaceUserListQueryHandler(),
  file_list: new FileListQueryHandler(),
  emojis_get: new EmojisGetQueryHandler(),
  icons_get: new IconsGetQueryHandler(),
  node_tree_get: new NodeTreeGetQueryHandler(),
  node_children_get: new NodeChildrenGetQueryHandler(),
  radar_data_get: new RadarDataGetQueryHandler(),
  file_metadata_get: new FileMetadataGetQueryHandler(),
  account_get: new AccountGetQueryHandler(),
  workspace_get: new WorkspaceGetQueryHandler(),
  download_get: new DownloadGetQueryHandler(),
};
