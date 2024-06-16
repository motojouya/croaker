import { kysely } from 'kysely'
import { CroakerTable, CroakerUpdate, Croaker, NewCroaker } from '@/rdb/type/croak'

export type Find = (db: Kysely) => (userId: string) => Promise<CroakerTable | null>;
export const find: Find = (db) => async (userId) => {
  return await db.selectFrom('croaker')
    .where('user_id', '=', userId)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (userIds: string[]) => Promise<CroakerTable[]>;
export const get: Get = (db) => async (userIds) => {
  return await db.selectFrom('croaker')
    .where('user_id', 'in', userIds)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (userId: string, updateWith: CroakerUpdate) => Promise<void>;
export const update: Update = (db) => async (userId, updateWith) => {
  await db.updateTable('croaker').set(updateWith).where('user_id', '=', userId).execute()
}

export type Create = (db: Kysely) => (croaker: NewCroaker) => Promise<CroakerTable>;
export const create: Create = (db) => (croaker) => {
  return await db.insertInto('croaker')
    .values(croaker)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (userId: string) => Promise<CroakerTable>;
export const delete: Delete = (db) => (userId) => {
  return await db.deleteFrom('croaker').where('user_id', '=', userId)
    .returningAll()
    .executeTakeFirst()
}
