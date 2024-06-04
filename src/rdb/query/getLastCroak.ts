import { Kysely, NotNull, Null } from 'kysely'
import { CROAKER_STATUS_ACTIVE } from '@/rdb/type/croak'
import { Croak } from '@/rdb/query/croak';

export type GetLastCroak = (db: Kysely) => (selfUserId: string) => Promise<Omit<Croak, 'links' | 'has_thread'>[]>;
export const getLastCroak: GetLastCroak = (db) => async (selfUserId) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.thread as thread',
      'croak.posted_date as posted_date',
      'false as has_thread',
      'croaker.identifier as croaker_identifier',
      'croaker.name as croaker_name',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.user_id', '=', 'croaker.user_id');
    })
    .where('croak.delete_date', NotNull)
    .where('croaker.user_id', '=', selfUserId)
    .orderBy(['croak.croak_id desc'])
    .limit(1)
    .execute();
};
