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
    .addColumn('user_id', 'text', (col) => col.primaryKey()) // foreign key
    .addColumn('croak_id', 'serial', (col) => col.primaryKey())
    .addColumn('content', 'text')
    .addColumn('file_path', 'text')
    .addColumn('thread', 'integer') // nullable top levelの場合にnull
    .addColumn('posted_date', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('delete_date', 'timestamp')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('croaker').execute();
  await db.schema.dropTable('croak').execute();
}
