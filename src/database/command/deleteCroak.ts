import { Kysely } from 'kysely'
import { CroakTable } from '@/rdb/type/croak'

export const DeleteCroak = (db: Kysely) => (croakId: string) => Promise<CroakTable>;
export const deleteCroak: DeleteCroak = (db) => async (croakId) => db
  .updateTable('croak')
  .set({ deleted_date: 'now()' })
  .where({ croak_id: croakId })
  .returningAll()
  .execute();
