import { kysely } from 'kysely'
import { RoleTable, RoleUpdate, Role, NewRole } from '@/rdb/type/master'

export type Find = (db: Kysely) => (roleId: number) => Promise<RoleTable | null>;
export const find: Find = (db) => async (roleId) => {
  return await db.selectFrom('role')
    .where('role_id', '=', role_id)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (roleIds: number[]) => Promise<RoleTable[] | null>;
export const get: Get = (db) => async (roleIds) => {
  return await db.selectFrom('role')
    .where('role_id', 'in', roleIds)
    .selectAll()
    .executeTakeFirst()
}

export type All = (db: Kysely) => () => Promise<RoleTable[] | null>;
export const all: All = (db) => async () => {
  return await db.selectFrom('role')
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (roleId: number, updateWith: RoleUpdate) => Promise<void>;
export const update: Update = (db) => async (roleId, updateWith) => {
  await db.updateTable('role').set(updateWith).where('role_id', '=', roleId).execute()
}

export type Create = (db: Kysely) => (role: NewRole) => Promise<RoleTable>;
export const create: Create = (db) => (role) => {
  return await db.insertInto('role')
    .values(role)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (roleId: number) => Promise<RoleTable>;
export const delete: Delete = (db) => (roleId) => {
  return await db.deleteFrom('role').where('role_id', '=', roleId)
    .returningAll()
    .executeTakeFirst()
}
