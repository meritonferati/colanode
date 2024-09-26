import { Migration, sql } from 'kysely';

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored(),
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
          .references('nodes.id')
          .onDelete('cascade'),
      )
      .addColumn('index', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.index')`)
          .stored(),
      )
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('state', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createNodesParentIdAndTypeIndex: Migration = {
  up: async (db) => {
    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP INDEX IF EXISTS "nodes_parent_id_type_index"`.execute(db);
  },
};

const createNodeReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_reactions')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('reactor_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('reaction', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'reactor_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_reactions').execute();
  },
};

const createMutationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('mutations')
      .addColumn('id', 'integer', (col) => col.notNull().primaryKey())
      .addColumn('table', 'text', (col) => col.notNull())
      .addColumn('action', 'text', (col) => col.notNull())
      .addColumn('before', 'text')
      .addColumn('after', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('mutations').execute();
  },
};

const createNodesInsertTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_insert_nodes
      AFTER INSERT ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL
      BEGIN
          INSERT INTO mutations ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'nodes',
              json_object(
                  'id', NEW.'id',
                  'type', NEW.'type',
                  'parent_id', NEW.'parent_id',
                  'index', NEW.'index',
                  'attributes', NEW.'attributes',
                  'state', NEW.'state',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_insert_nodes`.execute(db);
  },
};

const createNodesUpdateTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_update_nodes
      AFTER UPDATE ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL OR NEW.version_id != NEW.server_version_id
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'after', 'created_at')
          VALUES (
              'update',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'type', OLD.'type',
                  'parent_id', OLD.'parent_id',
                  'index', OLD.'index',
                  'attributes', OLD.'attributes',
                  'state', OLD.'state',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              json_object(
                  'id', NEW.'id',
                  'type', NEW.'type',
                  'parent_id', NEW.'parent_id',
                  'index', NEW.'index',
                  'attributes', NEW.'attributes',
                  'state', NEW.'state',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_update_nodes`.execute(db);
  },
};

const createDeleteNodesTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_delete_nodes
      AFTER DELETE ON nodes
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'type', OLD.'type',
                  'parent_id', OLD.'parent_id',
                  'index', OLD.'index',
                  'attributes', OLD.'attributes',
                  'state', OLD.'state',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_delete_nodes`.execute(db);
  },
};

const createNodeReactionsInsertTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_insert_node_reactions
      AFTER INSERT ON node_reactions
      FOR EACH ROW
      WHEN NEW.server_created_at IS NULL
      BEGIN
          INSERT INTO mutations ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'node_reactions',
              json_object(
                  'node_id', NEW.'node_id',
                  'reactor_id', NEW.'reactor_id',
                  'reaction', NEW.'reaction',
                  'created_at', NEW.'created_at',
                  'server_created_at', NEW.'server_created_at'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_insert_node_reactions`.execute(db);
  },
};

const createNodeReactionsDeleteTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_delete_node_reactions
      AFTER DELETE ON node_reactions
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'node_reactions',
              json_object(
                  'node_id', OLD.'node_id',
                  'reactor_id', OLD.'reactor_id',
                  'reaction', OLD.'reaction',
                  'created_at', OLD.'created_at',
                  'server_created_at', OLD.'server_created_at'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_delete_node_reactions`.execute(db);
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_nodes_table': createNodesTable,
  '00002_create_nodes_parent_id_and_type_index':
    createNodesParentIdAndTypeIndex,
  '00003_create_mutations_table': createMutationsTable,
  '00004_create_node_insert_trigger': createNodesInsertTrigger,
  '00005_create_node_update_trigger': createNodesUpdateTrigger,
  '00006_create_node_delete_trigger': createDeleteNodesTrigger,
  '00007_create_node_reactions_table': createNodeReactionsTable,
  '00008_create_node_reactions_insert_trigger':
    createNodeReactionsInsertTrigger,
  '00009_create_node_reactions_delete_trigger':
    createNodeReactionsDeleteTrigger,
};
