import { kysely } from 'kysely'
import { SessionTable, SessionUpdate, Session, NewSession } from '@/rdb/type/auth'

export type Find = (db: Kysely) => (id: string) => Promise<SessionTable | null>;
export const find: Find = (db) => async (id) => {
  return await db.selectFrom('session')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (ids: string[]) => Promise<SessionTable[] | null>;
export const get: Get = (db) => async (ids) => {
  return await db.selectFrom('session')
    .where('id', 'in', ids)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (id: string, updateWith: SessionUpdate) => Promise<void>;
export const update: Update = (db) => async (id, updateWith) => {
  await db.updateTable('session').set(updateWith).where('id', '=', id).execute()
}

export type Create = (db: Kysely) => (session: NewSession) => Promise<SessionTable>;
export const create: Create = (db) => (session) => {
  return await db.insertInto('session')
    .values(session)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (id: string) => Promise<SessionTable>;
export const delete: Delete = (db) => (id) => {
  return await db.deleteFrom('session').where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}
