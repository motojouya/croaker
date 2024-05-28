import { kysely } from 'kysely'
import { VerificationTokenTable, VerificationTokenUpdate, VerificationToken, NewVerificationToken } from '@/rdb/type/auth'

export type Find = (db: Kysely) => (identifier: string) => Promise<VerificationTokenTable | null>;
export const find: Find = (db) => async (identifier) => {
  return await db.selectFrom('verificationToken')
    .where('identifier', '=', identifier)
    .selectAll()
    .executeTakeFirst()
}

export type Get = (db: Kysely) => (identifiers: string[]) => Promise<VerificationTokenTable[] | null>;
export const get: Get = (db) => async (identifiers) => {
  return await db.selectFrom('verificationToken')
    .where('identifier', 'in', identifiers)
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (identifier: string, updateWith: VerificationTokenUpdate) => Promise<void>;
export const update: Update = (db) => async (identifier, updateWith) => {
  await db.updateTable('verificationToken').set(updateWith).where('identifier', '=', identifier).execute()
}

export type Create = (db: Kysely) => (verificationToken: NewVerificationToken) => Promise<VerificationTokenTable>;
export const create: Create = (db) => (verificationToken) => {
  return await db.insertInto('verificationToken')
    .values(verificationToken)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export type Delete = (db: Kysely) => (identifier: string) => Promise<VerificationTokenTable>;
export const delete: Delete = (db) => (identifier) => {
  return await db.deleteFrom('verificationToken').where('identifier', '=', identifier)
    .returningAll()
    .executeTakeFirst()
}
