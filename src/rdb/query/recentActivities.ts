import { Kysely, NotNull, Null } from 'kysely'
import { CROAKER_STATUS_ACTIVE } from '@/rdb/type/croak'
import { CroakMini } from '@/rdb/query/croak';

export type RecentActivities = (db: Kysely) => (selfUserId: string, days: number) => Promise<CroakMini[]>;
export const recentActivities: RecentActivities = (db) => async (selfUserId, days) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.thread as thread',
      'croak.posted_date as posted_date',
      'croaker.identifier as croaker_identifier',
      'croaker.name as croaker_name',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.user_id', '=', 'croaker.user_id');
    })
    .innerJoin(
      (eb) => {
        eb
          .selectFrom('croak')
          .select([
            'croak.user_id as user_id',
            'max(croak.croak_id) as max_croak_id',
          ])
          .where('croak.posted_date', '>', '7 days ago') // TODO
          .where('croak.delete_date', NotNull)
          .groupBy('croak.user_id')
          .as('su');
      },
      (join) => {
        join.onRef('croak.croak_id', '=', 'su.max_croak_id');
      }
    )
    .where('croak.posted_date', '>', '7 days ago') // TODO
    .where('croak.delete_date', NotNull)
    .where('croaker.status', '=', CROAKER_STATUS_ACTIVE)
    .where('croaker.user_id', '=', selfUserId)
    .orderBy(['croak.croak_id desc'])
    .execute();
};
