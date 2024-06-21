import { Kysely, NotNull, Null } from 'kysely'
import {
  CROAKER_STATUS_ACTIVE,
  CROAKER_STATUS_BANNED,
} from '@/rdb/type/croak'
import {
  Croak,
  CroakSimple,
  complementCroak,
} from '@/database/query/croak/croak';

export type Top = (db: Kysely) => (reverse: boolean, offsetCursor: number, limit: number) => Promise<Croak[]>;
export const top: Top =
  (db) =>
  (reverse, offsetCursor, limit) =>
  complementCroak(db, () => getCroaks(db)(reverse, offsetCursor, limit));

type GetCroaks = (db: Kysely) => (reverse: boolean, offsetCursor: number, limit: number) => Promise<CroakSimple[]>;
const getCroaks: GetCroaks = (db) => async (reverse, offsetCursor, limit) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.thread as thread',
      'case when thread.thread_id is null then false else then true end as has_thread',
      'croaker.identifier as croaker_identifier',
      'croaker.name as croaker_name',
      'croak.posted_date as posted_date',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.croaker_identifier', '=', 'croaker.identifier');
    })
    .leftJoin(
      (eb) => {
        eb
          .selectFrom('croak')
          .select(['croak.thread as thread_id'])
          .where('croak.thread', NotNull)
          .groupBy('croak.thread')
          .as('thread');
      },
      (join) => {
        join.onRef('croak.id', '=', 'thread.thread_id');
      }
    )
    .where('croak.delete_date', NotNull)
    .where('croaker.status', '=', CROAKER_STATUS_ACTIVE)
    .where('croak.delete_date', NotNull)
    .where('croak.thread', Null)
    .where('croak.id', reverse ? '>' : '<', offsetCursor)
    .orderBy('croak.id', reverse ? 'ASC' : 'DESC');
    .limit(limit)
    .execute();
};