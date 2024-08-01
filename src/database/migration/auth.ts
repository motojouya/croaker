import { Kysely, sql } from "kysely";
import { Database } from "@/database/type";

// printf('{%s-%s-%s-%s-%s}', lower(hex(randomblob(4))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(6))))

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("User")
    .addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(printf('{%s-%s-%s-%s-%s}', lower(hex(randomblob(4))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(6)))))`))
    .addColumn("name", "text")
    .addColumn("email", "text", (col) => col.unique().notNull())
    .addColumn("emailVerified", "timestamptz")
    .addColumn("image", "text")
    .execute();

  await db.schema
    .createTable("Account")
    .addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(printf('{%s-%s-%s-%s-%s}', lower(hex(randomblob(4))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(6)))))`))
    .addColumn("userId", "text", (col) => col.references("User.id").onDelete("cascade").notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("provider", "text", (col) => col.notNull())
    .addColumn("providerAccountId", "text", (col) => col.notNull())
    .addColumn("refresh_token", "text")
    .addColumn("access_token", "text")
    .addColumn("expires_at", "bigint")
    .addColumn("token_type", "text")
    .addColumn("scope", "text")
    .addColumn("id_token", "text")
    .addColumn("session_state", "text")
    .execute();

  await db.schema
    .createTable("Session")
    .addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(printf('{%s-%s-%s-%s-%s}', lower(hex(randomblob(4))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(2))), lower(hex(randomblob(6)))))`))
    .addColumn("userId", "text", (col) => col.references("User.id").onDelete("cascade").notNull())
    .addColumn("sessionToken", "text", (col) => col.notNull().unique())
    .addColumn("expires", "timestamptz", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("VerificationToken")
    .addColumn("identifier", "text", (col) => col.notNull())
    .addColumn("token", "text", (col) => col.notNull().unique())
    .addColumn("expires", "timestamptz", (col) => col.notNull())
    .execute();

  await db.schema.createIndex("Account_userId_index").on("Account").column("userId").execute();

  await db.schema.createIndex("Session_userId_index").on("Session").column("userId").execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("Account").ifExists().execute();
  await db.schema.dropTable("Session").ifExists().execute();
  await db.schema.dropTable("User").ifExists().execute();
  await db.schema.dropTable("VerificationToken").ifExists().execute();
}
