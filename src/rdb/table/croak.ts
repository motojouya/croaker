import { kysely, NotNull } from 'kysely'
import { CroakTable, CroakUpdate, Croak, NewCroak } from '@/rdb/type/croak'

export type Find = (db: Kysely) => (croakId: number) => Promise<CroakTable | null>;
export const find: Find = (db) => async (croakId) => {
  return await db.selectFrom('croak')
    .where('croak_id', '=', croakId)
    .where('deleted_date', NotNull)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (croakIds: number[]) => Promise<CroakTable[]>;
export const get: Get = (db) => async (croakIds) => {
  return await db.selectFrom('croak')
    .where('croak_id', 'in', croakIds)
    .where('deleted_date', NotNull)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (croakId: number, updateWith: CroakUpdate) => Promise<void>;
export const update: Update = (db) => async (croakId, updateWith) => {
  await db.updateTable('croak').set(updateWith).where('croak_id', '=', croakId).execute()
}

export type Create = (db: Kysely) => (croak: NewCroak) => Promise<CroakTable>;
export const create: Create = (db) => (croak) => {
  return await db.insertInto('croak')
    .values(croak)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (croakId: number) => Promise<CroakTable>;
export const delete: Delete = (db) => (croakId) => {
  return await db.deleteFrom('croak').where('croak_id', '=', croakId)
    .returningAll()
    .executeTakeFirst()
}
