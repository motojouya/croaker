import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('croaker')
    .addColumn('user_id', 'text', (col) => col.primaryKey()) // foreign key
    .addColumn('identifier', 'text', (col) => col.unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull()) // active or banned
    .addColumn('role_id', 'integer', (col) => col.notNull()) // foreign key
    .addColumn('form_agreement', 'tinyint', (col) => col.notNull())
    .addColumn('created_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('updated_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createTable('croak')
    .addColumn('croak_id', 'serial', (col) => col.primaryKey())
    .addColumn('croaker_identifier', 'text', (col) => col.notNull()) // foreign key
    .addColumn('content', 'text')
    .addColumn('thread', 'integer') // nullable top levelの場合にnull
    .addColumn('posted_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('delete_date', 'timestamp')
    .execute();

  await db.schema
    .createTable('link')
    .addColumn('croak_id', 'serial', (col) => col.primaryKey()) // foreign key
    .addColumn('url', 'text', (col) => col.primaryKey())
    .addColumn('type', 'text', (col) => col.notNull()) // image ogp etc
    .addColumn('title', 'text')
    .addColumn('image', 'text')
    .addColumn('summary', 'text')
    .addColumn('created_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createTable('file')
    .addColumn('file_id', 'serial', (col) => col.primaryKey())
    .addColumn('croak_id', 'text', (col) => col.primaryKey()) // foreign key
    .addColumn('type', 'text', (col) => col.notNull()) // gcs
    .addColumn('source', 'text', (col) => col.notNull()) // image ogp etc
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('content_type', 'text', (col) => col.notNull()) // mime type
    .addColumn('created_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createIndex("croak_thread_index")
    .on("Croak")
    .column("thread")
    .column("croak_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('croaker').execute();
  await db.schema.dropTable('croak').execute();
}
