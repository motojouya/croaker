import { kysely, NotNull, Null } from 'kysely'
import {
  CroakTable, 
  CROAKER_STATUS_ACTIVE,
  CROAKER_STATUS_BANNED,
} from '@/rdb/type/croak'

// TODO CroakTableにlinksつけたりとか、型が違うので、いじる
export type Top = (db: Kysely) => (cursor: number, limit: number) => Promise<CroakTable[]>;
export const top: Top = (db) => async (offsetCursor, limit) => {

  const result = await db
    .selectFrom('croak')
    .select([
      'croak.croak_id as croak_id',
      'croak.contents as contents',
      'croak.file_path as file_path',
      'case when thread.thread_id is null then false else then true end as has_thread', // TODO
      'croak.posted_date as posted_date',
      'croaker.identifier as croaker_identifier',
      'croaker.name as croaker_name',
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
        join.onRef('croak.id', '=', 'thread.thread');
      }
    )
    .where('croak.delete_date', NotNull)
    .where('croaker.status', '=', CROAKER_STATUS_ACTIVE)
    .where('croak.delete_date', NotNull)
    .where('croak.thread', Null)
    .where('croak.id', '>', offsetCursor)
    .limit(limit)
    .execute();

  // TODO ちゃんと扱いやすいようにtree上に整形してreturnする
  // linkテーブルもこの関数の中で取得してtree上に整形する
  return result;
}

export interface LinkTable {
  croak_id: number;
  url: string;
  type: string;
  title: string | null;
  image: string | null;
  summary: string | null;
  created_date: Date;
}
