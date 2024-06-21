import { Kysely, NotNull } from 'kysely'
import { CROAKER_STATUS_ACTIVE } from '@/rdb/type/croak'
import { CroakSimple } from '@/rdb/query/croakSimple/croakSimple';

export type RecentActivities = (db: Kysely) => (croakerId: string, days: number) => Promise<CroakSimple[]>;
export const recentActivities: RecentActivities = (db) => async (croakerId, days) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.thread as thread',
      'croak.posted_date as posted_date',
      'croaker.croaker_id as croaker_id',
      'croaker.name as croaker_name',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.croaker_id', '=', 'croaker.croaker_id');
    })
    .innerJoin(
      (eb) => {
        eb
          .selectFrom('croak')
          .select([
            'croak.croaker_id as croaker_id',
            'max(croak.croak_id) as max_croak_id',
          ])
          .where('croak.posted_date', '>', '7 days ago') // TODO
          .where('croak.delete_date', NotNull)
          .groupBy('croak.croaker_id')
          .as('su');
      },
      (join) => {
        join.onRef('croak.croak_id', '=', 'su.max_croak_id');
      }
    )
    .where('croak.posted_date', '>', '7 days ago') // TODO
    .where('croak.delete_date', NotNull)
    .where('croaker.status', '=', CROAKER_STATUS_ACTIVE)
    .where('croaker.croaker_id', '<>', croakerId)
    .orderBy(['croak.croak_id desc'])
    .execute();
};
