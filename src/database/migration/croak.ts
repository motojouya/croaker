import { Kysely, sql } from 'kysely'
import { Database } from '@/database/type';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('croaker')
    .addColumn('user_id', 'text', (col) => col.primaryKey().references('User.id'))
    .addColumn('croaker_id', 'text', (col) => col.unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'text', (col) => col.notNull()) // active or banned
    .addColumn('role_id', 'integer', (col) => col.notNull().references('role.role_id'))
    .addColumn('form_agreement', 'boolean', (col) => col.notNull())
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
    .addColumn('croaker_id', 'text', (col) => col.notNull().references('croaker.croaker_id'))
    .addColumn('content', 'text')
    .addColumn('thread', 'integer') // null when top level
    .addColumn('posted_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('delete_date', 'timestamp')
    .execute();

  await db.schema
    .createTable('link')
    .addColumn('croak_id', 'integer', (col) => col.primaryKey().references('croak.croak_id'))
    .addColumn('source', 'text', (col) => col.primaryKey())
    .addColumn('url', 'text')
    .addColumn('type', 'text') // content_type
    .addColumn('title', 'text')
    .addColumn('image', 'text')
    .addColumn('description', 'text')
    .addColumn('site_name', 'text')
    .addColumn('created_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await db.schema
    .createTable('file')
    .addColumn('file_id', 'serial', (col) => col.primaryKey())
    .addColumn('croak_id', 'text', (col) => col.primaryKey().references('croak.croak_id'))
    .addColumn('storage_type', 'text', (col) => col.notNull()) // gcs
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('content_type', 'text', (col) => col.notNull()) // content_type
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

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('croaker').execute();
  await db.schema.dropTable('croak').execute();
}
