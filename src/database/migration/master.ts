import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {

  // TODO
  await db.raw(sql<void>`PRAGMA foreign_keys = ON`).execute();

  await db.schema
    .createTable('configuration')
    .addColumn('active', 'tinyint', (col) => col.notNull())
    .addColumn('account_create_available', 'tinyint', (col) => col.notNull())
    .addColumn('default_role_id', 'integer', (col) => col.notNull())
    .addColumn('about_contents', 'text', (col) => col.primaryKey())
    .execute();

  await db.schema
    .createTable('role')
    .addColumn('role_id', 'integer', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull()) // owner visitor
    .addColumn('ban_power', 'tinyint', (col) => col.notNull())
    .addColumn('delete_other_post', 'tinyint', (col) => col.notNull())
    .addColumn('post', 'text', (col) => col.notNull()) // top thread disable
    .addColumn('post_file', 'tinyint', (col) => col.notNull())
    .addColumn('top_post_interval', 'integer', (col) => col.notNull())
    .addColumn('show_other_activities', 'tinyint', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.raw(sql<void>`PRAGMA foreign_keys = OFF`).execute();
  await db.schema.dropTable('role').execute();
  await db.schema.dropTable('configuration').execute();
}
