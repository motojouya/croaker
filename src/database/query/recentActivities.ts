import { Kysely, NotNull, Null } from 'kysely'
import { CROAKER_STATUS_ACTIVE } from '@/rdb/type/croak'
import { CroakMini } from '@/rdb/query/croak';

export type RecentActivities = (db: Kysely) => (selfIdentifier: string, days: number) => Promise<CroakMini[]>;
export const recentActivities: RecentActivities = (db) => async (selfIdentifier, days) => {
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
      join.onRef('croak.croaker_identifier', '=', 'croaker.identifier');
    })
    .innerJoin(
      (eb) => {
        eb
          .selectFrom('croak')
          .select([
            'croak.croaker_identifier as croaker_identifier',
            'max(croak.croak_id) as max_croak_id',
          ])
          .where('croak.posted_date', '>', '7 days ago') // TODO
          .where('croak.delete_date', NotNull)
          .groupBy('croak.croaker_identifier')
          .as('su');
      },
      (join) => {
        join.onRef('croak.croak_id', '=', 'su.max_croak_id');
      }
    )
    .where('croak.posted_date', '>', '7 days ago') // TODO
    .where('croak.delete_date', NotNull)
    .where('croaker.status', '=', CROAKER_STATUS_ACTIVE)
    .where('croaker.croaker_identifier', '=', selfIdentifier)
    .orderBy(['croak.croak_id desc'])
    .execute();
};
