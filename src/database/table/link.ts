import { kysely } from 'kysely'
import { LinkTable, LinkUpdate, Link, NewLink } from '@/rdb/type/croak'

export type Find = (db: Kysely) => (croakId: number, url: string) => Promise<LinkTable | null>;
export const find: Find = (db) => async (croakId, url) => {
  return await db.selectFrom('link')
    .where('croak_id', '=', croakId)
    .where('url', '=', url)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (croakId: number) => Promise<LinkTable[]>;
export const get: Get = (db) => async (croakId) => {
  return await db.selectFrom('link')
    .where('croak_id', '=', croakId)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (croakId: number, url: string, updateWith: LinkUpdate) => Promise<void>;
export const update: Update = (db) => async (croakId, url, updateWith) => {
  await db
    .updateTable('link')
    .set(updateWith)
    .where('croak_id', '=', croakId)
    .where('url', '=', url)
    .execute()
}

export type Create = (db: Kysely) => (link: NewLink) => Promise<LinkTable>;
export const create: Create = (db) => (link) => {
  return await db.insertInto('link')
    .values(link)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (croakId: number, url: string) => Promise<LinkTable>;
export const delete: Delete = (db) => (croakId, url) => {
  return await db.deleteFrom('link')
    .where('croak_id', '=', croakId)
    .where('url', '=', url)
    .returningAll()
    .executeTakeFirst()
}
