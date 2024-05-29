import { kysely } from 'kysely'
import { UserTable, UserUpdate, User, NewUser } from '@/rdb/type/auth'

export type Find = (db: Kysely) => (id: string) => Promise<UserTable | null>;
export const find: Find = (db) => async (id) => {
  return await db.selectFrom('user')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (ids: string[]) => Promise<UserTable[]>;
export const get: Get = (db) => async (ids) => {
  return await db.selectFrom('user')
    .where('id', 'in', ids)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (id: string, updateWith: UserUpdate) => Promise<void>;
export const update: Update = (db) => async (id, updateWith) => {
  await db.updateTable('user').set(updateWith).where('id', '=', id).execute()
}

export type Create = (db: Kysely) => (user: NewUser) => Promise<UserTable>;
export const create: Create = (db) => (user) => {
  return await db.insertInto('user')
    .values(user)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (id: string) => Promise<UserTable>;
export const delete: Delete = (db) => (id) => {
  return await db.deleteFrom('user').where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}
