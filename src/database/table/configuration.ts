import { kysely } from 'kysely'
import { ConfigurationTable, ConfigurationUpdate, Configuration, NewConfiguration } from '@/rdb/type/master'

export type Find = (db: Kysely) => () => Promise<ConfigurationTable | null>;
export const find: Find = (db) => async () => {
  return await db.selectFrom('configuration')
    .selectAll()
    .executeTakeFirst()
}

export type Update = (db: Kysely) => (updateWith: ConfigurationUpdate) => Promise<void>;
export const update: Update = (db) => async (updateWith) => {
  await db.updateTable('configuration').set(updateWith).execute()
}
