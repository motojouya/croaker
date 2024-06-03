import { Kysely, NotNull, Null } from 'kysely'
import {
  CROAKER_STATUS_ACTIVE,
  CROAKER_STATUS_BANNED,
} from '@/rdb/type/croak'
import {
  Croak,
  getLinks,
} from '@/rdb/query/croak';

export type Top = (db: Kysely) => (offsetCursor: number, limit: number) => Promise<Croak[]>;
export const top: Top = (db) => async (offsetCursor, limit) => {

  const croaks = await getCroaks(db)(offsetCursor, limit);

  const croakIds = croaks.map(croak => croak.croak_id);

  const links = await getLinks(db)(croakIds);

  const croakIdLinkDic = Object.groupBy('croak_id', links);

  return croaks.map(croak => ({
    ...croak,
    links: croakIdLinkDic[croak.id] || [],
  }));
}

type GetCroaks = (db: Kysely) => (offsetCursor: number, limit: number) => Promise<Omit<Croak, 'links'>[]>;
const getCroaks: GetCroaks = (db) => async (offsetCursor, limit) => {
  return await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.file_path as file_path',
      'case when thread.thread_id is null then false else then true end as has_thread',
      'croaker.identifier as croaker_identifier',
      'croaker.name as croaker_name',
      'croak.posted_date as posted_date',
    ])
    .innerJoin('croaker', (join) => {
      join.onRef('croak.user_id', '=', 'croaker.user_id');
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
    .where('croak.id', '>', offsetCursor)
    .limit(limit)
    .execute();
};
