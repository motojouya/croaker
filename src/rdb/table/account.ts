import { kysely } from 'kysely'
import { AccountTable, AccountUpdate, Account, NewAccount } from '@/rdb/type/auth'

export type Find = (db: Kysely) => (id: string) => Promise<AccountTable | null>;
export const find: Find = (db) => async (id) => {
  return await db.selectFrom('account')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (ids: string[]) => Promise<AccountTable[] | null>;
export const get: Get = (db) => async (ids) => {
  return await db.selectFrom('account')
    .where('id', 'in', ids)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (id: string, updateWith: AccountUpdate) => Promise<void>;
export const update: Update = (db) => async (id, updateWith) => {
  await db.updateTable('account').set(updateWith).where('id', '=', id).execute()
}

export type Create = (db: Kysely) => (account: NewAccount) => Promise<AccountTable>;
export const create: Create = (db) => (account) => {
  return await db.insertInto('account')
    .values(account)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (id: string) => Promise<AccountTable>;
export const delete: Delete = (db) => (id) => {
  return await db.deleteFrom('account').where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}
