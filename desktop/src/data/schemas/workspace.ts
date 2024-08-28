import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface NodeTable {
  id: ColumnType<string, string, never>;
  parent_id?: ColumnType<string | null, string | null, string | null>;
  type: ColumnType<string, string, string>;
  index: ColumnType<string | null, string | null, string | null>;
  attrs: ColumnType<string | null, string | null, string | null>;
  content: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<string, string, never>;
  updated_at?: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by?: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at?: ColumnType<string | null, string | null, string | null>;
  server_updated_at?: ColumnType<string | null, string | null, string | null>;
  server_version_id?: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface MutationTable {
  id: ColumnType<number, never, never>;
  table: ColumnType<string, string, never>;
  action: ColumnType<string, string, never>;
  before: ColumnType<string | null, string | null, never>;
  after: ColumnType<string | null, string | null, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

export interface WorkspaceDatabaseSchema {
  nodes: NodeTable;
  mutations: MutationTable;
}
