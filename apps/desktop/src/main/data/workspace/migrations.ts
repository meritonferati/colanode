import { Migration, sql } from 'kysely';

const createUsersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('users')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('custom_name', 'text')
      .addColumn('custom_avatar', 'text')
      .addColumn('role', 'text', (col) => col.notNull())
      .addColumn('status', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('users').execute();
  },
};

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored()
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
          .notNull()
      )
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('transaction_id', 'text', (col) => col.notNull())
      .execute();

    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('operation', 'text', (col) => col.notNull())
      .addColumn('data', 'blob')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('transactions').execute();
  },
};

const createCollaborationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('collaborations')
      .addColumn('node_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('role', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('deleted_at', 'text')
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('collaborations').execute();
  },
};

const createMessagesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('messages')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('updated_by', 'text')
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('messages').execute();
  },
};

const createMessageReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('message_reactions')
      .addColumn('message_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('reaction', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('message_reactions_pkey', [
        'message_id',
        'collaborator_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('message_reactions').execute();
  },
};

const createFilesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('files')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('original_name', 'text', (col) => col.notNull())
      .addColumn('mime_type', 'text', (col) => col.notNull())
      .addColumn('extension', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('updated_by', 'text')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('files').execute();
  },
};

const createFileStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('file_states')
      .addColumn('file_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('download_status', 'text', (col) => col.notNull())
      .addColumn('download_progress', 'integer', (col) => col.notNull())
      .addColumn('download_retries', 'integer', (col) => col.notNull())
      .addColumn('upload_status', 'text', (col) => col.notNull())
      .addColumn('upload_progress', 'integer', (col) => col.notNull())
      .addColumn('upload_retries', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('file_states').execute();
  },
};

const createMutationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('mutations')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('data', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retries', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('mutations').execute();
  },
};

const createInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('interactions')
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text')
      .addColumn('last_seen_at', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.lastSeenAt')`)
          .stored()
      )
      .addColumn('last_opened_at', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.lastOpenedAt')`)
          .stored()
      )
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('interactions_pkey', ['user_id', 'node_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('interactions').execute();
  },
};

const createInteractionEventsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('interaction_events')
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('attribute', 'text', (col) => col.notNull())
      .addColumn('value', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('sent_at', 'text')
      .addColumn('sent_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('event_id', 'text', (col) => col.notNull())
      .addPrimaryKeyConstraint('interaction_events_pkey', [
        'node_id',
        'attribute',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('interaction_events').execute();
  },
};

const createNodePathsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_paths')
      .addColumn('ancestor_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('descendant_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE TRIGGER trg_insert_node_path
      AFTER INSERT ON nodes
      FOR EACH ROW
      BEGIN
        -- Insert direct path from the new node to itself
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        VALUES (NEW.id, NEW.id, 0);

        -- Insert paths from ancestors to the new node
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_update_node_path
      AFTER UPDATE ON nodes
      FOR EACH ROW
      WHEN OLD.parent_id <> NEW.parent_id
      BEGIN
        -- Delete old paths involving the updated node
        DELETE FROM node_paths
        WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

        -- Insert new paths from ancestors to the updated node
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_node_path;
      DROP TRIGGER IF EXISTS trg_update_node_path;
    `.execute(db);

    await db.schema.dropTable('node_paths').execute();
  },
};

const createNodeNamesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE node_names USING fts5(id UNINDEXED, name);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS node_names;
    `.execute(db);
  },
};

const createNodeTextsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE node_texts USING fts5(id UNINDEXED, text);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS node_texts;
    `.execute(db);
  },
};

const createCursorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('cursors')
      .addColumn('key', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('cursors').execute();
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_users_table': createUsersTable,
  '00002_create_nodes_table': createNodesTable,
  '00003_create_transactions_table': createTransactionsTable,
  '00004_create_collaborations_table': createCollaborationsTable,
  '00005_create_messages_table': createMessagesTable,
  '00006_create_message_reactions_table': createMessageReactionsTable,
  '00007_create_files_table': createFilesTable,
  '00008_create_file_states_table': createFileStatesTable,
  '00009_create_interactions_table': createInteractionsTable,
  '00010_create_interaction_events_table': createInteractionEventsTable,
  '00011_create_mutations_table': createMutationsTable,
  '00012_create_node_paths_table': createNodePathsTable,
  '00013_create_node_names_table': createNodeNamesTable,
  '00014_create_node_texts_table': createNodeTextsTable,
  '00015_create_cursors_table': createCursorsTable,
};
