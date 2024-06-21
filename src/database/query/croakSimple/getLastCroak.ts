import { Kysely, NotNull } from 'kysely'
import { CroakSimple } from '@/rdb/query/croakSimple/croakSimple';

export type GetLastCroak = (db: Kysely) => (croakerId: string) => Promise<CroakSimple[]>;
export const getLastCroak: GetLastCroak = (db) => async (croakerId) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.thread as thread',
      'croak.posted_date as posted_date',
      'false as has_thread',
      'croaker.croaker_id as croaker_id',
      'croaker.name as croaker_name',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.croaker_id', '=', 'croaker.croaker_id');
    })
    .where('croak.delete_date', NotNull)
    .where('croaker.croaker_id', '=', croakerId)
    .orderBy(['croak.croak_id desc'])
    .limit(1)
    .execute();
};
