import { Kysely, NotNull, Null } from 'kysely'
import { Croak } from '@/rdb/query/croak';
import { top } from '@/rdb/query/top';
import { search } from '@/rdb/query/search';
import { thread } from '@/rdb/query/thread';
import { Context } from '@/lib/context';

export type CroakList = {
  croaks: Croak[];
  has_next: bool;
};

export const DISPLAY_LIMIT = 20;

export type GetTopCroaks = (context: Context) => (cursor?: number) => Promise<CroakList>
export const getTopCroaks: GetTopCroaks = (context) => async (cursor) => {
  const result = await top(context.db)(offsetCursor(cursor), DISPLAY_LIMIT + 1);
  // TODO fileに関してpresigned urlを発行する
  return getCroakList(result);
};

export type GetThreadCroaks = (context: Context) => (threadId: number, cursor?: number) => Promise<CroakList>
export const getThreadCroaks: GetThreadCroaks = (context) => async (threadId, cursor) => {
  const result = await thread(context.db)(threadId, offsetCursor(cursor), DISPLAY_LIMIT + 1);
  // TODO fileに関してpresigned urlを発行する
  return getCroakList(result);
};

export type SearchCroaks = (context: Context) => (search: string, cursor?: number) => Promise<CroakList>
export const searchCroaks: SearchCroaks = (context) => async (search, cursor) => {
  const result = await search(context.db)(search, offsetCursor(cursor), DISPLAY_LIMIT + 1);
  // TODO fileに関してpresigned urlを発行する
  return getCroakList(result);
};

type OffsetCursor = (cursor?: number) => number;
const offsetCursor: OffsetCursor = (cursor) => cursor ? cursor - 1 : 0;

type GetCroakList = (croaks: Croak[]) => Promise<CroakList>
const getCroakList: GetCroakList = (croaks) => {

  if (croaks.length > DISPLAY_LIMIT) {
    const limited = result.toSpliced(DISPLAY_LIMIT - 1, 1);
    return {
      croaks: limited,
      has_next: true,
    };

  } else {
    return {
      croaks,
      has_next: false,
    };
  }
}
