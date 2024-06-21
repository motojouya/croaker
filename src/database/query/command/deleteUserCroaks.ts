import { Kysely } from 'kysely'
import { CroakTable } from '@/rdb/type/croak'

export const DeleteUserCroaks = (db: Kysely) => (croakerIdentifier: string) => Promise<CroakTable>;
export const deleteUserCroaks: DeleteUserCroaks = (db) => async (croakerIdentifier) => {
  return db
    .updateTable('croak')
    .set({ deleted_date: 'now()' })
    .where({ croaker_identifier: croaker_identifier })
    .returningAll()
    .execute();
};
