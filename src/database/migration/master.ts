import { Kysely, sql } from "kysely";
import { Database } from "@/database/type";

export async function up(db: Kysely<Database>): Promise<void> {
  await sql<void>`PRAGMA foreign_keys = true`.execute(db);

  await db.schema
    .createTable("configuration")
    .addColumn("active", "boolean", (col) => col.notNull())
    .addColumn("account_create_available", "boolean", (col) => col.notNull())
    .addColumn("default_role_id", "integer", (col) => col.notNull())
    .addColumn("about_contents", "text", (col) => col.primaryKey())
    .execute();

  await db.schema
    .createTable("role")
    .addColumn("role_id", "integer", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull()) // owner visitor
    .addColumn("ban_power", "boolean", (col) => col.notNull())
    .addColumn("delete_other_post", "boolean", (col) => col.notNull())
    .addColumn("post", "text", (col) => col.notNull()) // top thread disable
    .addColumn("post_file", "boolean", (col) => col.notNull())
    .addColumn("top_post_interval", "integer", (col) => col.notNull())
    .addColumn("show_other_activities", "boolean", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql<void>`PRAGMA foreign_keys = false`.execute(db);
  await db.schema.dropTable("role").execute();
  await db.schema.dropTable("configuration").execute();
}
